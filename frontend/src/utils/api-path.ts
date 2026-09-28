/**
 * Builds a backend API path with every interpolated value encoded as one path segment, so an id can never add
 * segments, a query or a fragment of its own:
 *
 *   apiPath`errands/${errandId}/notes/${noteId}`
 *
 * The literal parts are used as they are. Query parameters go in the request's `params`, not in the path.
 */
export const apiPath = (literals: TemplateStringsArray, ...segments: (string | number)[]): string =>
  literals
    .slice(1)
    .reduce(
      (path, literal, index) => `${path}${encodeURIComponent(String(segments[index] ?? ''))}${literal}`,
      literals[0] ?? ''
    );
