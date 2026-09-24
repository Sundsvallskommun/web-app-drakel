import { CAREMANAGEMENT_BASE_URL, CAREMANAGEMENT_NAMESPACE, MUNICIPALITY_ID } from '@config';

const joinSegments = (segments: string[]): string => segments.map(segment => segment.replace(/^\/+|\/+$/g, '')).join('/');

/**
 * Builds an absolute caremanagement URL scoped to the configured municipality and namespace.
 *
 * caremanagement is reached directly, NOT through the shared API gateway used by other APIs,
 * so the full host comes from CAREMANAGEMENT_BASE_URL. municipalityId and namespace are injected
 * here so the rest of the stack — and the entire frontend — stays tenant-agnostic.
 *
 * @param parts Path segments appended after the municipality/namespace scope
 */
export const caremanagementUrl = (...parts: string[]): string =>
  joinSegments([CAREMANAGEMENT_BASE_URL, MUNICIPALITY_ID, CAREMANAGEMENT_NAMESPACE, ...parts]);

/**
 * Builds an absolute caremanagement URL scoped to the configured municipality only — for the resources that
 * belong to no namespace, e.g. a user's settings.
 *
 * @param parts Path segments appended after the municipality scope
 */
export const caremanagementMunicipalityUrl = (...parts: string[]): string => joinSegments([CAREMANAGEMENT_BASE_URL, MUNICIPALITY_ID, ...parts]);
