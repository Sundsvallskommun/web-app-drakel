/** ORIGIN's wildcard: any origin. */
const ANY_ORIGIN = '*';

/**
 * Whether a request's Origin may use the API across origins.
 *
 * A request with no Origin at all — same-origin, a top-level navigation, a server-to-server client — is not a CORS
 * request and passes. Otherwise the origin must be listed in ORIGIN. The wildcard is honoured only while credentials
 * are off: with credentials on, CORS reflects the caller's origin with Access-Control-Allow-Credentials, and a wildcard
 * would let any site read a signed-in handläggare's responses.
 *
 * @param origin The request's Origin header, if it has one
 * @param allowedOrigins The origins ORIGIN lists
 * @param credentials Whether the API answers credentialed (cookie) requests, CREDENTIALS
 */
export const isAllowedCorsOrigin = (origin: string | undefined, allowedOrigins: string[], credentials: boolean): boolean =>
  origin === undefined || allowedOrigins.includes(origin) || (!credentials && allowedOrigins.includes(ANY_ORIGIN));

/** Whether ORIGIN asks for the wildcard although credentials are on — a setting {@link isAllowedCorsOrigin} refuses. */
export const isRefusedWildcard = (allowedOrigins: string[], credentials: boolean): boolean => credentials && allowedOrigins.includes(ANY_ORIGIN);
