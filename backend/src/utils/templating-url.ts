import { MUNICIPALITY_ID, TEMPLATING_BASE_URL } from '@config';

/**
 * Builds an absolute Templating-service URL scoped to the configured municipality. Templating is reached
 * directly on TEMPLATING_BASE_URL (no API gateway, no auth) — like caremanagement — and its paths are
 * `/{municipalityId}/...`, so the municipality is injected here and callers pass the rest.
 *
 * @param parts Path segments appended after the municipality scope
 */
export const templatingUrl = (...parts: string[]): string => {
  const segments = [TEMPLATING_BASE_URL, MUNICIPALITY_ID, ...parts];
  return segments.map((segment) => segment.replace(/^\/+|\/+$/g, '')).join('/');
};
