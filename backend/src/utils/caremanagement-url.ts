import { CAREMANAGEMENT_NAMESPACE, MUNICIPALITY_ID } from '@config';

import { gatewayUrl } from './gateway-url';

/**
 * Builds an absolute caremanagement URL on the WSO2 gateway, scoped to the configured municipality and namespace.
 * municipalityId and namespace are injected here so the rest of the stack — and the entire frontend — stays
 * tenant-agnostic.
 *
 * @param parts Path segments appended after the municipality/namespace scope
 */
export const caremanagementUrl = (...parts: string[]): string => gatewayUrl('caremanagement', MUNICIPALITY_ID, CAREMANAGEMENT_NAMESPACE, ...parts);

/**
 * Builds an absolute caremanagement URL on the WSO2 gateway, scoped to the configured municipality only — for the
 * resources that belong to no namespace, e.g. a user's settings.
 *
 * @param parts Path segments appended after the municipality scope
 */
export const caremanagementMunicipalityUrl = (...parts: string[]): string => gatewayUrl('caremanagement', MUNICIPALITY_ID, ...parts);

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
