import 'reflect-metadata';

import {
  APP_NAME,
  BASE_URL_PREFIX,
  CREDENTIALS,
  LOG_FORMAT,
  NODE_ENV,
  PORT,
  SAML_CALLBACK_URL,
  SAML_ENTRY_SSO,
  SAML_FAILURE_REDIRECT,
  SAML_IDP_PUBLIC_CERT,
  SAML_ISSUER,
  SAML_LOGOUT_CALLBACK_URL,
  SAML_PRIVATE_KEY,
  SAML_PUBLIC_KEY,
  SAML_SUCCESS_REDIRECT,
  SAML_VALIDATE_IN_RESPONSE_TO,
  SAML_WANT_ASSERTIONS_SIGNED,
  SWAGGER_ENABLED,
} from '@config';
import authMiddleware from '@middlewares/auth.middleware';
import errorMiddleware from '@middlewares/error.middleware';
import requestContextMiddleware from '@middlewares/request-context.middleware';
import { Profile as SamlProfile, Strategy, VerifiedCallback } from '@node-saml/passport-saml';
import { logger, stream } from '@utils/logger';
import bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Request, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { existsSync, mkdirSync } from 'fs';
import helmet from 'helmet';
import passport from 'passport';
import { join } from 'path';
import { getMetadataArgsStorage, useExpressServer } from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import swaggerUi from 'swagger-ui-express';

import { Profile } from './interfaces/profile.interface';
import { User } from './interfaces/users.interface';
import { authorizeGroups, getPermissions, getRole } from './services/authorization.service';
import { isAllowedCorsOrigin, isRefusedWildcard } from './utils/cors-origin';
import { allowedOrigins } from './utils/isValidOrigin';
import { openApiSchemas } from './utils/openapi-schemas';
import { requestLogger } from './utils/request-log';
import { toInResponseToCheck } from './utils/saml-in-response-to';
import { allowedRedirect, buildRelayState, parseRelayState } from './utils/saml-relay-state';
import { sessionMiddleware } from './utils/session-middleware';
import { STRICT_VALIDATION } from './utils/validate-input';

const corsWhitelist = allowedOrigins();

const IS_PRODUCTION = NODE_ENV === 'production';

/** How far the IdP's clock may be off ours before an assertion's validity window is refused. */
const SAML_CLOCK_SKEW_MS = 5000;

// Rate limit the public, unauthenticated SAML endpoints to throttle brute-force/replay
// attempts and limit the DoS surface of session creation + assertion verification.
const samlRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // per IP per window — generous for a per-login SSO flow
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

/**
 * Hands the SAML RelayState to passport-saml. Express 5's `req.query` is a read-only getter recomputed from `req.url`,
 * so writes to it are silently discarded; passport-saml reads RelayState from `req.query.RelayState || req.body.RelayState`,
 * so it is stashed on `req.body` instead.
 */
const stashRelayState = (req: Request, relayState: string): void => {
  if (relayState) {
    req.body = { ...(req.body as Record<string, unknown> | undefined), RelayState: relayState };
  }
};

passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (user, done) {
  done(null, user as Express.User);
});

const samlStrategy = new Strategy(
  {
    disableRequestedAuthnContext: true,
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    callbackUrl: SAML_CALLBACK_URL,
    entryPoint: SAML_ENTRY_SSO,
    // decryptionPvk: SAML_PRIVATE_KEY,
    privateKey: SAML_PRIVATE_KEY,
    // Identity Provider's public key
    idpCert: SAML_IDP_PUBLIC_CERT,
    issuer: SAML_ISSUER,
    // Every assertion must carry the IdP's signature; the response around it need not be signed as well.
    wantAssertionsSigned: SAML_WANT_ASSERTIONS_SIGNED,
    wantAuthnResponseSigned: false,
    // A response must answer a login request drakel sent (its id is kept until the callback), so an unsolicited or a
    // replayed response is refused.
    validateInResponseTo: toInResponseToCheck(SAML_VALIDATE_IN_RESPONSE_TO),
    // Assertions outside their NotBefore/NotOnOrAfter window (give or take the skew) are refused; -1 turned the check off.
    acceptedClockSkewMs: SAML_CLOCK_SKEW_MS,
    // In production an assertion must be addressed to us — our SP entityID, the issuer. The development IdP addresses
    // its assertions to its own configured SP metadata URL instead, so the check stays off there.
    audience: IS_PRODUCTION ? SAML_ISSUER : false,
    logoutCallbackUrl: SAML_LOGOUT_CALLBACK_URL,
  },
  function (profile: SamlProfile | null, done: VerifiedCallback) {
    if (!profile) {
      done({
        name: 'SAML_MISSING_PROFILE',
        message: 'Missing SAML profile',
      });
      return;
    }
    const { givenName, surname, username, groups } = profile as Profile;

    if (!givenName || !surname || !username || !groups) {
      done({
        name: 'SAML_MISSING_ATTRIBUTES',
        message: 'Missing profile attributes',
      });
      return;
    }

    if (!authorizeGroups(groups)) {
      logger.error('Group authorization failed. Is the user a member of an authorized group?');
      done(null, undefined, {
        name: 'SAML_MISSING_GROUP',
        message: 'SAML_MISSING_GROUP',
      });
      return;
    }

    const userGroups = groups
      .split(',')
      .map(group => group.trim().toLowerCase())
      .filter(Boolean);

    const findUser: User = {
      username: username,
      name: `${givenName} ${surname}`,
      givenName: givenName,
      surname: surname,
      groups: userGroups,
      role: getRole(userGroups),
      permissions: getPermissions(userGroups),
    };

    done(null, findUser as unknown as Record<string, unknown>);
  },
  function (_profile: SamlProfile | null, done: VerifiedCallback) {
    done(null, {});
  },
);

// A controller is a class; routing-controllers accepts the class references themselves.
type ControllerClass = new (...args: never[]) => object;

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;
  public swaggerEnabled: boolean;

  constructor(Controllers: ControllerClass[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;
    this.swaggerEnabled = SWAGGER_ENABLED || false;

    this.initializeDataFolders();

    this.initializeMiddlewares();
    this.initializeRoutes(Controllers);
    if (this.swaggerEnabled) {
      this.initializeSwagger(Controllers);
    }
    this.initializeErrorHandling();
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    // Behind the reverse proxy the real client IP arrives in X-Forwarded-For. Without this,
    // express-rate-limit keys every request on the proxy's own IP, so all users share one quota —
    // the SAML limiter would lock everyone out together. `1` trusts exactly one proxy hop; raise it
    // if requests pass through more than one. It is also what lets Express see from X-Forwarded-Proto
    // that a request came in over HTTPS, which the session's secure cookie depends on in production.
    this.app.set('trust proxy', 1);

    this.app.use(requestLogger(LOG_FORMAT, stream));
    this.app.use(helmet());
    this.app.use(compression());
    // JSON only: the one form-encoded body drakel takes is the IdP's login POST, which parses its own (see below).
    this.app.use(express.json());
    this.app.use(cookieParser());

    this.app.use(sessionMiddleware());

    this.app.use(passport.initialize());
    this.app.use(passport.session());
    passport.use('saml', samlStrategy);

    // After passport so req.user is populated: stash the user in request-scoped storage for the
    // caremanagement transport's X-Sent-By header (feeds caremanagement's per-errand event log).
    this.app.use(requestContextMiddleware);

    if (isRefusedWildcard(corsWhitelist, CREDENTIALS)) {
      logger.error("ORIGIN '*' is ignored while CREDENTIALS is on: list the frontend's origins instead.");
    }
    const corsMiddleware = cors({
      credentials: CREDENTIALS,
      origin: function (origin, callback) {
        if (isAllowedCorsOrigin(origin, corsWhitelist, CREDENTIALS)) {
          callback(null, true);
        } else {
          logger.warn(`CORS rejected origin '${origin ?? ''}' (allowed: ${corsWhitelist.join(', ') || 'none'})`);
          callback(new Error('Not allowed by CORS'));
        }
      },
    });

    // The SAML endpoints are reached by top-level form navigations from the IdP, never by fetch/XHR.
    // Browsers serialize the Origin of such a cross-site POST as the literal `null`, which no
    // whitelist can match — and CORS governs whether script may *read* a response, not whether a
    // navigation may happen, so it protects nothing here. What authenticates the callback is the
    // signature on the SAML assertion. Running these routes through CORS rejected the IdP's POST
    // with "Not allowed by CORS" and made login impossible.
    this.app.use((req, res, next) => {
      if (req.path.startsWith(`${BASE_URL_PREFIX}/saml/`)) {
        next();
        return;
      }
      corsMiddleware(req, res, next);
    });

    this.app.get(
      `${BASE_URL_PREFIX}/saml/login`,
      samlRateLimiter,
      (req, res, next) => {
        stashRelayState(req, buildRelayState(req.session.returnTo ?? req.query.successRedirect, req.query.failureRedirect));
        next();
      },
      (req, res, next) => {
        void (
          passport.authenticate('saml', {
            failureRedirect: SAML_FAILURE_REDIRECT,
          }) as RequestHandler
        )(req, res, next);
      },
    );

    this.app.get(`${BASE_URL_PREFIX}/saml/metadata`, samlRateLimiter, (req, res) => {
      res.type('application/xml');
      const metadata = samlStrategy.generateServiceProviderMetadata(SAML_PUBLIC_KEY, SAML_PUBLIC_KEY);
      res.status(200).send(metadata);
    });

    this.app.get(
      `${BASE_URL_PREFIX}/saml/logout`,
      samlRateLimiter,
      (req, res, next) => {
        // See stashRelayState: samlStrategy.logout() reads RelayState from req.body too.
        stashRelayState(req, buildRelayState(req.session.returnTo ?? req.query.successRedirect));
        next();
      },
      (req, res, next) => {
        const successRedirect = allowedRedirect(req.query.successRedirect)?.toString() ?? SAML_SUCCESS_REDIRECT;

        samlStrategy.logout(req as unknown as Parameters<typeof samlStrategy.logout>[0], () => {
          req.logout(err => {
            if (err) {
              next(err);
              return;
            }
            res.redirect(successRedirect);
          });
        });
      },
    );

    // The IdP comes back here with a redirect (a GET), so the RelayState is in the query. Logging out cannot fail
    // once req.logout has run, so the browser goes to the success redirect the RelayState names — when it is allowed.
    this.app.get(`${BASE_URL_PREFIX}/saml/logout/callback`, samlRateLimiter, (req, res, next) => {
      req.logout(err => {
        if (err) {
          next(err);
          return;
        }
        const { successRedirect } = parseRelayState(req.query.RelayState, SAML_SUCCESS_REDIRECT);
        res.redirect(successRedirect.toString());
      });
    });

    this.app.post(`${BASE_URL_PREFIX}/saml/login/callback`, samlRateLimiter, bodyParser.urlencoded({ extended: false }), (req, res, next) => {
      const { successRedirect, failureRedirect } = parseRelayState((req.body as { RelayState?: unknown }).RelayState, SAML_SUCCESS_REDIRECT);

      /** Sends the browser to the failure redirect, telling the frontend why. */
      const redirectToFailure = (failMessage: string): void => {
        const queries = new URLSearchParams(failureRedirect.searchParams);
        queries.append('failMessage', failMessage);
        failureRedirect.search = queries.toString();
        res.redirect(failureRedirect.toString());
      };

      void (
        passport.authenticate('saml', (err: Error | null, user?: Express.User | false) => {
          if (err) {
            redirectToFailure(err.name || 'SAML_UNKNOWN_ERROR');
          } else if (!user) {
            redirectToFailure('NO_USER');
          } else {
            req.login(user, loginErr => {
              if (loginErr) {
                redirectToFailure('SAML_UNKNOWN_ERROR');
                return;
              }
              res.redirect(successRedirect.toString());
            });
          }
        }) as RequestHandler
      )(req, res, next);
    });
  }

  private initializeRoutes(controllers: ControllerClass[]) {
    useExpressServer(this.app, {
      routePrefix: BASE_URL_PREFIX,
      controllers: controllers,
      defaultErrorHandler: false,
      // Every @Body, @QueryParams … DTO is validated with unknown properties refused, so nothing a DTO does not name
      // reaches a handler — or is passed on upstream.
      validation: STRICT_VALIDATION,
    });
  }

  private initializeSwagger(controllers: ControllerClass[]) {
    const routingControllersOptions = {
      routePrefix: BASE_URL_PREFIX,
      controllers: controllers,
    };

    const storage = getMetadataArgsStorage();
    type OpenApiComponents = NonNullable<Parameters<typeof routingControllersToSpec>[2]>['components'];
    type SchemasMap = NonNullable<NonNullable<OpenApiComponents>['schemas']>;
    const spec = routingControllersToSpec(storage, routingControllersOptions, {
      components: {
        schemas: openApiSchemas() as unknown as SchemasMap,
        securitySchemes: {
          basicAuth: {
            scheme: 'basic',
            type: 'http',
          },
        },
      },
      info: {
        title: `${APP_NAME} Proxy API`,
        description: '',
        version: '1.0.0',
      },
    });

    // The API's map is for signed-in users only in production. In development it stays open: the frontend's
    // contract generator reads swagger.json without a session.
    const swaggerGuard: RequestHandler[] = IS_PRODUCTION ? [authMiddleware] : [];
    this.app.use(`${BASE_URL_PREFIX}/swagger.json`, ...swaggerGuard, (req: express.Request, res: express.Response) => {
      res.json(spec);
    });
    this.app.use(`${BASE_URL_PREFIX}/api-docs`, ...swaggerGuard, swaggerUi.serve, swaggerUi.setup(spec));
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeDataFolders() {
    const logsDir: string = join(__dirname, '../data/logs');
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true });
    }
    const sessionsDir: string = join(__dirname, '../data/sessions');
    if (!existsSync(sessionsDir)) {
      mkdirSync(sessionsDir, { recursive: true });
    }
  }
}

export default App;
