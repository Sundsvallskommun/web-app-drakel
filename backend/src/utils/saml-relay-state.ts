import { isValidOrigin } from './isValidOrigin';
import { isValidUrl } from './util';

/** Where to send the browser once the IdP is done: after success, and after a failure. */
interface RelayRedirects {
  successRedirect: URL;
  failureRedirect: URL;
}

/**
 * A redirect target the client asked for, if it may be used: an absolute http(s) URL on one of the allowed origins
 * (ORIGIN). Anything else would make drakel an open redirect.
 *
 * @param candidate The target as it arrived — from the query or the RelayState
 */
export const allowedRedirect = (candidate: unknown): URL | undefined =>
  typeof candidate === 'string' && isValidUrl(candidate) && isValidOrigin(candidate) ? new URL(candidate) : undefined;

/**
 * The SAML RelayState carrying the redirects through the IdP round trip: `success[,failure]`. Nothing is checked
 * here — {@link parseRelayState} checks both when the IdP hands the state back.
 *
 * @param successRedirect Where to go after a successful login or logout, as the client asked
 * @param failureRedirect Where to go after a failed login, as the client asked
 */
export const buildRelayState = (successRedirect: unknown, failureRedirect?: unknown): string => {
  const success = typeof successRedirect === 'string' ? successRedirect : '';
  return typeof failureRedirect === 'string' ? `${success},${failureRedirect}` : success;
};

/**
 * The redirects a RelayState names, each replaced when it is not allowed: the success redirect by the configured
 * fallback, the failure redirect by the success redirect.
 *
 * @param relayState The RelayState the IdP handed back
 * @param fallback The configured redirect after success (SAML_SUCCESS_REDIRECT)
 */
export const parseRelayState = (relayState: unknown, fallback: string): RelayRedirects => {
  const [success, failure] = typeof relayState === 'string' ? relayState.split(',') : [];
  const successRedirect = allowedRedirect(success) ?? new URL(fallback);
  return { successRedirect, failureRedirect: allowedRedirect(failure) ?? successRedirect };
};
