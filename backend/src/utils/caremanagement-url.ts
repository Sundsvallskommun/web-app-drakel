import { CAREMANAGEMENT_BASE_URL, CAREMANAGEMENT_NAMESPACE, MUNICIPALITY_ID } from '@config';

import { ownHostOrGatewayUrl } from './gateway-url';

/**
 * caremanagement's root: its own host when CAREMANAGEMENT_BASE_URL is set (e.g. the Dokploy instance), otherwise the
 * WSO2 gateway.
 */
const caremanagementRoot = (...parts: string[]): string => ownHostOrGatewayUrl(CAREMANAGEMENT_BASE_URL, 'caremanagement', ...parts);

/**
 * Builds an absolute caremanagement URL (gateway, or CAREMANAGEMENT_BASE_URL), scoped to the municipality and namespace.
 * municipalityId and namespace are injected here so the rest of the stack — and the entire frontend — stays
 * tenant-agnostic.
 *
 * @param parts Path segments appended after the municipality/namespace scope
 */
export const caremanagementUrl = (...parts: string[]): string => caremanagementRoot(MUNICIPALITY_ID, CAREMANAGEMENT_NAMESPACE, ...parts);

/**
 * Builds an absolute caremanagement URL (gateway, or CAREMANAGEMENT_BASE_URL), scoped to the municipality only — for the
 * resources that belong to no namespace, e.g. a user's settings.
 *
 * @param parts Path segments appended after the municipality scope
 */
export const caremanagementMunicipalityUrl = (...parts: string[]): string => caremanagementRoot(MUNICIPALITY_ID, ...parts);

/**
 * An errand's route under caremanagement's Lifecare integration — everything drakel does in Lifecare goes through
 * careM, which signs in, holds the session, resolves insats and personnummer from the errand, links what it
 * creates to the errand and logs every access itself.
 *
 * @param errandId The errand (careM id)
 * @param parts Path segments after `/lifecare`, e.g. `'decision', 'pdf'`
 */
export const caremanagementLifecareUrl = (errandId: string, ...parts: string[]): string =>
  caremanagementUrl('errands', 'financial-assistance', errandId, 'lifecare', ...parts);
