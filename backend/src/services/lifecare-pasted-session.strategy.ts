import { LIFECARE_SESSION_COOKIE, NODE_ENV } from '@config';
import { HttpException } from '@exceptions/HttpException';
import { LifecareAuthStrategy } from '@interfaces/lifecare.interface';
import { LifecareCookieStore, SIGNED_IN_COOKIE } from '@utils/lifecare-cookies';
import { logger } from '@utils/logger';

/**
 * Reuses a Lifecare session copied out of a signed-in browser. **Development only.**
 *
 * This is scaffolding, not a way of running. It exists so the transport can be built and verified
 * against real endpoints while the integration account is still being sorted out: sign in to
 * Lifecare, copy the `Cookie` header off any api2 call in devtools, and paste it into
 * `LIFECARE_SESSION_COOKIE` in `.env.development.local`.
 *
 * The session it borrows belongs to a real person and dies on its own within the hour, so it is
 * never a deployment strategy — it refuses to run outside development for exactly that reason. The
 * real strategy logs in with credentials of its own and plugs in at {@link LifecareAuthStrategy}
 * without anything above it changing.
 */
export class PastedLifecareSession implements LifecareAuthStrategy {
  public readonly name = 'a session pasted into LIFECARE_SESSION_COOKIE';

  public authenticate(cookies: LifecareCookieStore): Promise<void> {
    if (NODE_ENV !== 'development') {
      return Promise.reject(new HttpException(500, 'A pasted Lifecare session must never be used outside development'));
    }

    if (!LIFECARE_SESSION_COOKIE) {
      return Promise.reject(new HttpException(502, 'No Lifecare session to borrow — LIFECARE_SESSION_COOKIE is unset'));
    }

    cookies.absorbCookieHeader(LIFECARE_SESSION_COOKIE);

    if (!cookies.has(SIGNED_IN_COOKIE)) {
      // Said here rather than left to surface as a 360 three calls later, because the two failures
      // look identical from the outside and only one of them is fixed by pasting again.
      return Promise.reject(
        new HttpException(
          502,
          `The pasted Lifecare session has no ${SIGNED_IN_COOKIE}, so it is not a signed-in session. It holds: ${cookies.names().join(', ')}`,
        ),
      );
    }

    logger.warn("Lifecare is running on a pasted session — it belongs to a real user and will expire. Don't ship this.");

    return Promise.resolve();
  }
}
