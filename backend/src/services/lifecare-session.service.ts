import {
  LIFECARE_ACTOR,
  LIFECARE_BASE_URL,
  LIFECARE_DOMAIN,
  LIFECARE_FEDERATION_PROFILE,
  LIFECARE_IDP_METHOD,
  LIFECARE_SESSION_TTL_MINUTES,
  NODE_ENV,
} from '@config';
import { HttpException } from '@exceptions/HttpException';
import { LifecareAuthStrategy, LifecareModule } from '@interfaces/lifecare.interface';
import { cookieHeader, LifecareCookieStore, SIGNED_IN_COOKIE } from '@utils/lifecare-cookies';
import { bodySnippet, describeResponse, followLifecareRedirects, setCookieHeaders } from '@utils/lifecare-http';
import { clearPersistedSession, loadPersistedSession, savePersistedSession } from '@utils/lifecare-session-store';
import { lifecareUrl } from '@utils/lifecare-url';
import { logger } from '@utils/logger';
import { AxiosResponse } from 'axios';

/**
 * Keeps one Lifecare session alive and hands out the cookies that prove it.
 *
 * Signing in is this service's job; deciding *how* is the strategy's — see
 * {@link LifecareAuthStrategy}.
 *
 * A module bootstrap is the other half, and it is done on demand rather than up front. Lifecare's
 * own client works that way: it calls an endpoint, and only if the module answers "I need a
 * session" does it fetch a `Heartbeat` artifact and ask again. Doing it eagerly assumes every
 * module always needs one, which is both slower and — as a freshly signed-in session shows — not
 * true. The transport asks for a bootstrap when Lifecare says it wants one.
 *
 * Sign-in and bootstraps are cached and shared, so fifty calls arriving together produce one of
 * each rather than fifty. Failures are never cached, or one bad minute would poison every call
 * after it.
 *
 * The session outlives the process. It is written to disk on sign-in and reloaded on the next
 * start, so a restart reuses the session instead of signing in afresh — a real saving when signing
 * in means driving a browser. A session past its TTL is re-established before it is used, and the
 * transport still signs in reactively if Lifecare drops the session mid-flight.
 */
class LifecareSessionService {
  private readonly cookies = new LifecareCookieStore();
  private authentication: Promise<void> | undefined;
  private readonly bootstraps = new Map<LifecareModule, Promise<void>>();
  /** When the current session was signed in, 0 when there is none. Survives a restart. */
  private establishedAt = 0;
  private readonly ttlMs = LIFECARE_SESSION_TTL_MINUTES * 60_000;

  constructor(private readonly strategy: LifecareAuthStrategy) {
    const persisted = loadPersistedSession();
    if (persisted && persisted.cookies.length > 0) {
      this.cookies.replaceAll(persisted.cookies);
      this.establishedAt = persisted.establishedAt;
      const age = Math.round((Date.now() - persisted.establishedAt) / 60_000);
      logger.info(`Loaded a persisted Lifecare session (${age} min old)`);
    }
  }

  /** Makes sure there is a session, and returns the headers that carry it. */
  public async prepare(): Promise<Record<string, string>> {
    if (!LIFECARE_BASE_URL) {
      throw new HttpException(502, 'Lifecare is not configured (LIFECARE_BASE_URL is unset)');
    }

    this.seedConfiguration();
    if (this.isExpired()) {
      logger.info('Lifecare session has passed its TTL — signing in again');
      this.reset();
    }
    await this.authenticate();

    const headers = cookieHeader(this.cookies);

    // Writes are guarded by a double-submit check: ProfessionalWeb reads LEGACY-TOKEN from both the
    // cookie and this header and refuses (a 500) if they disagree. Reads never need it, but sending
    // it always is harmless and keeps the two paths identical. Derived from the cookie so it stays
    // correct across a re-sign-in.
    const legacyToken = this.cookies.get(SIGNED_IN_COOKIE);
    if (legacyToken) {
      headers['X-LEGACY-TOKEN'] = legacyToken;
    }

    return headers;
  }

  /**
   * Asks the identity portal to hand `module` an artifact of its own.
   *
   * Called when a module has said it wants one, never speculatively.
   */
  public bootstrapModule(module: LifecareModule): Promise<void> {
    const started = this.bootstraps.get(module);
    if (started) return started;

    const bootstrap = this.runHeartbeat(module).catch((error: unknown) => {
      this.bootstraps.delete(module);
      throw error;
    });
    this.bootstraps.set(module, bootstrap);
    return bootstrap;
  }

  /** Takes in cookies Lifecare rotated on an ordinary call, so the session stays current. */
  public absorb(response: AxiosResponse): void {
    const setCookies = setCookieHeaders(response);
    if (!setCookies || setCookies.length === 0) return;

    this.cookies.absorbSetCookie(setCookies);
    // Keep the persisted copy in step with a rotated cookie, or a restart would reload a session
    // one step behind the live one.
    if (this.establishedAt > 0) this.persist();
  }

  /**
   * Throws the session away so the next call builds a new one.
   *
   * The module bootstraps go with it: their artifacts were issued against the session that died,
   * and the persisted copy is removed so a restart does not reload a session known to be dead.
   */
  public reset(): void {
    this.cookies.clear();
    this.authentication = undefined;
    this.bootstraps.clear();
    this.establishedAt = 0;
    clearPersistedSession();
  }

  /**
   * The cookies Lifecare's identity portal normally picks up off the query string on a first visit.
   * Nothing issues them to a server-side caller, so they are set directly — without them the portal
   * does not know which domain or actor the session is being established for.
   */
  private seedConfiguration(): void {
    if (LIFECARE_DOMAIN) this.cookies.set('metadomain', LIFECARE_DOMAIN);
    if (LIFECARE_ACTOR) this.cookies.set('actor', LIFECARE_ACTOR);
    if (LIFECARE_IDP_METHOD) this.cookies.set('idpmethod', LIFECARE_IDP_METHOD);
    if (LIFECARE_FEDERATION_PROFILE) this.cookies.set('federationprofile', LIFECARE_FEDERATION_PROFILE);
  }

  /** Whether the session established (or loaded) so far is still usable. */
  private isEstablished(): boolean {
    return this.establishedAt > 0 && this.cookies.has(SIGNED_IN_COOKIE);
  }

  /** Whether an established session has outlived its TTL. Never true when there is no session. */
  private isExpired(): boolean {
    return this.establishedAt > 0 && Date.now() - this.establishedAt >= this.ttlMs;
  }

  private persist(): void {
    savePersistedSession({ cookies: this.cookies.entries(), establishedAt: this.establishedAt });
  }

  private authenticate(): Promise<void> {
    // A session loaded from disk, or already signed in this run, needs nothing further — the
    // expiry check in prepare() has already cleared it if it was too old.
    if (this.isEstablished()) return Promise.resolve();

    if (!this.authentication) {
      logger.info(`Establishing a Lifecare session via ${this.strategy.name}`);
      this.authentication = this.strategy
        .authenticate(this.cookies)
        .then(() => {
          this.establishedAt = Date.now();
          this.persist();
          // Names only, never values. Held against the cookie list of a working browser session,
          // this says in one line whether ours is the same kind of thing or short of something.
          logger.info(`Lifecare session holds: ${this.cookies.names().join(', ')}`);
        })
        .catch((error: unknown) => {
          this.authentication = undefined;
          throw error;
        });
    }
    return this.authentication;
  }

  private async runHeartbeat(module: LifecareModule): Promise<void> {
    const artifact = await followLifecareRedirects(lifecareUrl(module, 'Heartbeat'), this.cookies);
    logger.info(`Lifecare handed ${module} its artifact (${describeResponse(artifact)})`);

    if (artifact.status !== 200) {
      throw new HttpException(502, `Lifecare would not start a session for ${module} (${describeResponse(artifact)})`);
    }

    // A bootstrap that has taken answers with script. Anything else is a page rather than a
    // session, and the first line of it says which page — which is the whole diagnosis.
    if (NODE_ENV === 'development') {
      const page = bodySnippet(artifact, 300);
      if (page) logger.warn(`Lifecare bootstrap body for ${module}: ${page}`);
    }
  }
}

export default LifecareSessionService;
