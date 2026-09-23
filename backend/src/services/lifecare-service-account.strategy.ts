import { LIFECARE_ACTOR, LIFECARE_BASE_URL, LIFECARE_DOMAIN, LIFECARE_IDP_METHOD, LIFECARE_PASSWORD, LIFECARE_USERNAME, NODE_ENV } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { LifecareAuthStrategy } from '@interfaces/lifecare.interface';
import { LifecareCookieStore, SIGNED_IN_COOKIE } from '@utils/lifecare-cookies';
import { extractForm } from '@utils/lifecare-form';
import { bodySnippet, followLifecareRedirects } from '@utils/lifecare-http';
import { logger } from '@utils/logger';
import { AxiosResponse } from 'axios';

/**
 * The login flow is: post the SAML request onwards, sign in, post the assertion back. Three hops,
 * plus slack for an identity provider that adds one of its own.
 */
const MAX_FORM_HOPS = 6;

const bodyOf = (response: AxiosResponse<unknown>): string => (typeof response.data === 'string' ? response.data : '');

/**
 * Signs drakel in to Lifecare as its own integration account.
 *
 * This walks exactly the flow a handläggare's browser walks — the one captured in the login HAR —
 * only without a browser: open Lifecare's entry URL, follow the redirects into the identity
 * provider, submit the sign-in form, and post the resulting assertion back to Lifecare. Each hop's
 * cookies are carried into the next, and what falls out at the end is the session Lifecare
 * recognises.
 *
 * Every form along the way is **read off the page** rather than hardcoded. The field names belong
 * to the identity provider and are not ours to assume; discovering them is also what makes the flow
 * survive the provider restyling its login page.
 *
 * What it cannot do is answer a second factor. If the account is enrolled for a one-time code, the
 * flow ends on a page with no password field and this throws — a server has nothing to type into a
 * code box, and no amount of code changes that.
 */
export class ServiceAccountLifecareSession implements LifecareAuthStrategy {
  public readonly name = `the Lifecare account ${LIFECARE_USERNAME}`;

  public async authenticate(cookies: LifecareCookieStore): Promise<void> {
    if (!LIFECARE_USERNAME || !LIFECARE_PASSWORD) {
      throw new HttpException(502, 'No Lifecare account configured (LIFECARE_USERNAME / LIFECARE_PASSWORD)');
    }

    let response = await followLifecareRedirects(this.entryUrl(), cookies);
    let signedIn = false;
    let lastAction: string | undefined;

    for (let hop = 0; hop < MAX_FORM_HOPS; hop += 1) {
      if (cookies.has(SIGNED_IN_COOKIE)) {
        logger.info('Lifecare accepted the integration account');
        return;
      }

      const form = extractForm(bodyOf(response), response.config.url ?? this.entryUrl());
      if (!form) break;

      if (form.action === lastAction) {
        // A page that posts itself back to the same place is a waiting room, not a step: the
        // identity provider is polling while something outside the page authenticates — a push to
        // a phone, a token from the workstation. Nothing we can post will satisfy it, and posting
        // again only hammers the identity provider.
        this.describeStall(response);
        throw new HttpException(
          502,
          `The identity provider is waiting at ${new URL(form.action).pathname} rather than asking for a password — the account is not being offered password sign-in`,
        );
      }
      lastAction = form.action;

      if (form.passwordField) {
        if (signedIn) {
          // We have already sent the credentials once and are being asked again: either they are
          // wrong, or the account is being asked for something a server cannot give.
          throw new HttpException(
            502,
            'Lifecare asked the integration account to sign in a second time — check the credentials, or whether the account is enrolled for a one-time code',
          );
        }
        if (!form.usernameField) {
          throw new HttpException(502, 'Could not tell which field the Lifecare username belongs in on the sign-in page');
        }

        form.fields[form.usernameField] = LIFECARE_USERNAME;
        form.fields[form.passwordField] = LIFECARE_PASSWORD;
        signedIn = true;
      }

      // Names the step without naming what is in it, so a flow that stalls says where it stalled.
      const destination = new URL(form.action);
      logger.info(
        `Lifecare sign-in: posting ${form.passwordField ? 'credentials' : 'the flow onwards'} to ${destination.host}${destination.pathname}`,
      );

      response = await followLifecareRedirects(form.action, cookies, { fields: form.fields });
    }

    if (cookies.has(SIGNED_IN_COOKIE)) {
      logger.info('Lifecare accepted the integration account');
      return;
    }

    this.describeStall(response);
    throw new HttpException(
      502,
      signedIn
        ? 'Lifecare never issued a session after the integration account signed in'
        : 'The Lifecare sign-in page had no password field — the flow may be asking for a one-time code',
    );
  }

  /**
   * Puts the page the sign-in came to rest on into the log, in development.
   *
   * When the flow stalls it stalls on a page, and that page says what it is waiting for — a code, a
   * phone, a token. Guessing at it from the outside costs a round trip each time; reading it costs
   * nothing. Development only: what the identity provider renders is not for a server's log file.
   */
  private describeStall(response: AxiosResponse<unknown>): void {
    if (NODE_ENV !== 'development') return;

    const page = bodySnippet(response, 500);
    if (page) logger.warn(`Lifecare sign-in stalled on: ${page}`);
  }

  /** Lifecare's entry point for a handläggare, the URL a browser is pointed at to start the flow. */
  private entryUrl(): string {
    const url = new URL(`${LIFECARE_BASE_URL.replace(/\/+$/, '')}/WE.Flow.Html`);
    url.searchParams.set('domain', LIFECARE_DOMAIN);
    url.searchParams.set('Actor', LIFECARE_ACTOR);
    url.searchParams.set('IDPMethod', LIFECARE_IDP_METHOD);
    return url.toString();
  }
}
