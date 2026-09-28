import { HttpException } from '@/exceptions/HttpException';

const BAD_REQUEST = 400;

/**
 * Segments URL resolution treats as navigation rather than a name. `new URL()` — and so axios — resolves them away,
 * and treats their percent-encoded forms (`%2e%2e`) the same way, so encoding cannot defuse them: they are refused.
 */
const DOT_SEGMENTS = new Set(['.', '..']);

/**
 * One path segment, percent-encoded so that a value from drakel's own URL (an errand id, a template identifier …)
 * can only ever be a single segment of the upstream URL: a `/` becomes `%2F`, and `?` or `#` cannot start a query or
 * a fragment. An empty or a dot segment would change which upstream resource is addressed, so it is a 400.
 *
 * @param segment The raw segment, not yet encoded
 */
const encodePathSegment = (segment: string): string => {
  if (segment === '' || DOT_SEGMENTS.has(segment)) {
    throw new HttpException(BAD_REQUEST, 'Invalid path segment');
  }
  return encodeURIComponent(segment);
};

/**
 * A configured base URL without its trailing slashes. Walks back from the end once rather than using a regex like
 * `/\/+$/`, whose backtracking is quadratic on a long run of slashes.
 */
const withoutTrailingSlashes = (base: string): string => {
  let end = base.length;
  while (end > 0 && base.charAt(end - 1) === '/') {
    end -= 1;
  }
  return base.slice(0, end);
};

/**
 * Joins a configured base URL and path segments into one absolute URL — the single place drakel builds an upstream URL
 * from parts. The base is trusted configuration and used as it is (bar trailing slashes); every segment is encoded and
 * checked with {@link encodePathSegment}, so callers pass raw values and must not encode them themselves.
 *
 * @param base A configured base URL, e.g. API_BASE_URL or CAREMANAGEMENT_BASE_URL
 * @param segments Path segments after the base, raw
 */
export const joinUrlSegments = (base: string, ...segments: string[]): string =>
  [withoutTrailingSlashes(base), ...segments.map(encodePathSegment)].join('/');
