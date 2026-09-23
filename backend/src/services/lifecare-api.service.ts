import { LIFECARE_BASE_URL, LIFECARE_BROWSER_SIGN_IN, LIFECARE_USERNAME, NODE_ENV } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { ApiResponse } from '@interfaces/api-service.interface';
import { LifecareAuthStrategy, LifecareRequest } from '@interfaces/lifecare.interface';
import { lifecareAgent } from '@utils/lifecare-agent';
import { lifecareError, lifecareUnreachable } from '@utils/lifecare-error';
import { describeResponse, LIFECARE_AJAX_HEADERS, needsLifecareSession } from '@utils/lifecare-http';
import { lifecareUrl } from '@utils/lifecare-url';
import { logger } from '@utils/logger';
import axios, { AxiosResponse } from 'axios';

import { BrowserLifecareSession } from './lifecare-browser-session.strategy';
import { PastedLifecareSession } from './lifecare-pasted-session.strategy';
import { ServiceAccountLifecareSession } from './lifecare-service-account.strategy';
import LifecareSessionService from './lifecare-session.service';

/**
 * The one Lifecare session the process keeps. Shared on purpose: a session costs a sign-in and a
 * bootstrap per module, so handing every service its own would multiply both for nothing.
 *
 * Which strategy is in play is decided by configuration alone: an account means the BFF signs
 * itself in, and its absence leaves the development scaffolding. This is the line the whole
 * integration was built to keep swappable — a delegated per-handläggare session slots in here too.
 */
const chooseStrategy = (): LifecareAuthStrategy => {
  if (!LIFECARE_USERNAME) return new PastedLifecareSession();
  return LIFECARE_BROWSER_SIGN_IN ? new BrowserLifecareSession() : new ServiceAccountLifecareSession();
};

/** The HTTP methods drakel uses against api2. */
type LifecareMethod = 'GET' | 'POST' | 'DELETE';

const sharedSession = new LifecareSessionService(chooseStrategy());

/**
 * Establishes the Lifecare session at startup, rather than leaving the first request to pay for it.
 *
 * Fire-and-forget on purpose: a Lifecare outage at boot must never stop the BFF starting, so a
 * failure is logged and the lazy path retries on the first real call. Does nothing when Lifecare is
 * not configured for this environment. When a persisted session is still good, this is a no-op.
 */
export const warmUpLifecareSession = (): void => {
  if (!LIFECARE_BASE_URL) return;

  void sharedSession
    .prepare()
    .then(() => logger.info('Lifecare session ready'))
    .catch((error: unknown) => logger.error(`Lifecare session warm-up failed: ${error instanceof Error ? error.message : String(error)}`));
};

/**
 * Transport for Lifecare's api2 endpoints.
 *
 * Mirrors {@link CaremanagementApiService} in shape — services above it deal in typed responses and
 * never in cookies — but Lifecare demands two things caremanagement does not: a session that has to
 * be established and re-established (see {@link LifecareSessionService}), and the ajax headers that
 * make api2 answer a machine the way it answers Lifecare's own web client.
 *
 * Reads only, for now. Writing to Lifecare additionally means carrying the
 * `__RequestVerificationToken` pair through every call, and nothing needs to write yet.
 */
class LifecareApiService {
  constructor(private readonly session: LifecareSessionService = sharedSession) {}

  public get<T>(request: LifecareRequest): Promise<ApiResponse<T>> {
    return this.requestWithSession<T>(request, 'GET');
  }

  /**
   * Writes to Lifecare.
   *
   * A write reuses the same session escalation as a read, and it is safe to: when Lifecare answers
   * that a session is needed, it has rejected the request before acting on it, so retrying does not
   * risk writing twice. A 2xx never retries.
   *
   * Lifecare's own writes carry the `__RequestVerificationToken` pair (ASP.NET antiforgery). That
   * cookie rides along in the session automatically; whether the endpoint also demands the matching
   * request token is not yet known, and the first real POST will say.
   */
  public post<T>(request: LifecareRequest, body: unknown): Promise<ApiResponse<T>> {
    return this.requestWithSession<T>(request, 'POST', body);
  }

  /**
   * Removes something in Lifecare. Lifecare's own client sends the id in a JSON body rather than the
   * URL, so the body goes along as on a POST. Retrying on a session refusal is as safe as for a write:
   * Lifecare refused before acting on it.
   */
  public delete<T>(request: LifecareRequest, body: unknown): Promise<ApiResponse<T>> {
    return this.requestWithSession<T>(request, 'DELETE', body);
  }

  private async requestWithSession<T>(request: LifecareRequest, method: LifecareMethod, body?: unknown): Promise<ApiResponse<T>> {
    let response = await this.send<T>(request, method, body);

    if (needsLifecareSession(response)) {
      // First escalation: the module wants an artifact of its own. This is exactly what Lifecare's
      // own client does when it meets a 360, and it is the ordinary case for a session that has
      // not spoken to this module yet.
      logger.warn(`Lifecare wants a session for ${request.module} (${describeResponse(response)}) — bootstrapping it`);
      await this.session.bootstrapModule(request.module);
      response = await this.send<T>(request, method, body);
    }

    if (needsLifecareSession(response)) {
      // Second escalation: it is the session that is gone, not just this module's artifact.
      // Lifecare sessions time out on idle, so sign in afresh and ask once more.
      logger.warn(`Lifecare still refuses ${request.path} (${describeResponse(response)}) — signing in again`);
      this.session.reset();
      response = await this.send<T>(request, method, body);
    }

    if (needsLifecareSession(response)) {
      this.explain(response);
      throw new HttpException(502, `Lifecare would not accept a freshly established session (${describeResponse(response)})`);
    }

    if (response.status < 200 || response.status >= 300) {
      this.explain(response);
      throw lifecareError(response);
    }

    return { data: response.data, message: 'success' };
  }

  /**
   * Puts the beginning of a refused answer in the log, in development only.
   *
   * When Lifecare will not take a session it says why in the page it sends instead — an expiry
   * notice, an error page, a login form. That sentence is the whole diagnosis, and guessing at it
   * costs more than printing it. Development only, because a body from Lifecare can just as easily
   * hold someone's data, and that does not belong in a log file on a server.
   */
  private explain(response: AxiosResponse<unknown>): void {
    if (NODE_ENV !== 'development') return;

    const body: unknown = response.data;
    const asText = typeof body === 'string' ? body : body == null ? '' : JSON.stringify(body);
    if (asText === '') {
      logger.warn(`Lifecare answered ${response.status} with an empty body`);
      return;
    }

    logger.warn(`Lifecare sent back (${response.status}): ${asText.slice(0, 600).replace(/\s+/g, ' ')}`);
  }

  private async send<T>(request: LifecareRequest, method: LifecareMethod, body?: unknown): Promise<AxiosResponse<T>> {
    const cookies = await this.session.prepare();

    try {
      const response = await axios<T>({
        method,
        url: lifecareUrl(request.module, request.path),
        params: request.params,
        data: body,
        headers: {
          ...LIFECARE_AJAX_HEADERS,
          // Lifecare's own client sends these on every api2 call, and ASP.NET applications of this
          // vintage are prone to checking them. Cheap to send, and each costs a round of guessing
          // if it turns out to matter.
          Origin: new URL(LIFECARE_BASE_URL).origin,
          Referer: `${LIFECARE_BASE_URL.replace(/\/+$/, '')}/WE.Flow.Html/`,
          // Only on a write, and matching what Lifecare's own client sends down to the charset.
          ...(method !== 'GET' ? { 'Content-Type': 'application/json; charset=UTF-8' } : {}),
          ...cookies,
        },
        // Redirects are never followed blindly here: one means the session is gone, and that is a
        // thing to detect rather than to chase.
        maxRedirects: 0,
        // Lifecare answers a dead session with a status of its own, so statuses are read rather
        // than thrown on.
        validateStatus: () => true,
        httpsAgent: lifecareAgent(),
        timeout: 30000,
      });

      this.session.absorb(response);
      return response;
    } catch (error) {
      throw lifecareUnreachable(error);
    }
  }
}

export default LifecareApiService;
