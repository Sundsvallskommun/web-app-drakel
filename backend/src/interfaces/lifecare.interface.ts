import { LifecareCookieStore } from '@utils/lifecare-cookies';

/**
 * The Lifecare web modules drakel reads from.
 *
 * Each module bootstraps a session of its own: being logged in is not enough, every module must
 * first be handed an artifact by the identity portal before it answers with anything but a redirect.
 * See {@link LifecareSessionService}.
 */
export type LifecareModule = 'WESE.FC.ProfessionalWeb' | 'WESE.FC.ConfigurationWeb' | 'WE.SystemInformationWeb2';

/** One read from a Lifecare module. */
export interface LifecareRequest {
  module: LifecareModule;
  /** The path below the module, e.g. `api2/Person/Search`. */
  path: string;
  params?: Record<string, string>;
}

/**
 * How a Lifecare session comes into being.
 *
 * This is the seam the integration turns on. Lifecare's session cookies are bound to the Lifecare
 * host, so the BFF cannot borrow the one the handläggare's browser holds — it has to hold a session
 * of its own. Where that session comes from is the open question, so it lives behind this interface:
 *
 * - {@link PastedLifecareSession} reuses a session copied out of devtools. Development only, and the
 *   only strategy that exists while we wait for an account.
 * - A service-account strategy (drives the SAML flow in `.har` with credentials of its own) plugs in
 *   here unchanged once the account exists.
 * - A forwarded-session strategy (reads the cookies off the incoming request) plugs in here too, if
 *   the BFF is ever reachable under the Lifecare host so the browser sends them along.
 *
 * Nothing above this interface needs to change when the strategy does.
 */
export interface LifecareAuthStrategy {
  /** Named in logs so it is never a mystery which strategy a running instance used. */
  readonly name: string;
  /** Puts a usable Lifecare session into `cookies`, or throws if it cannot. */
  authenticate(cookies: LifecareCookieStore): Promise<void>;
}
