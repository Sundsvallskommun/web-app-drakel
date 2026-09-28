import { CAREMANAGEMENT_BASE_URL, CAREMANAGEMENT_NAMESPACE, MUNICIPALITY_ID } from '@config';

import { ownHostOrGatewayUrl } from './gateway-url';

/**
 * caremanagement's type slug for ekonomiskt bistånd — the one errand type drakel handles. It is what a new errand is
 * created with, and the route segment of caremanagement's financial-assistance API.
 */
export const FINANCIAL_ASSISTANCE_TYPE_SLUG = 'financial-assistance';

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
 * @param parts Path segments appended after the municipality/namespace scope — raw, each is encoded
 */
export const caremanagementUrl = (...parts: string[]): string => caremanagementRoot(MUNICIPALITY_ID, CAREMANAGEMENT_NAMESPACE, ...parts);

/**
 * Builds an absolute caremanagement URL (gateway, or CAREMANAGEMENT_BASE_URL), scoped to the municipality only — for the
 * resources that belong to no namespace, e.g. a user's settings.
 *
 * @param parts Path segments appended after the municipality scope — raw, each is encoded
 */
export const caremanagementMunicipalityUrl = (...parts: string[]): string => caremanagementRoot(MUNICIPALITY_ID, ...parts);

/**
 * A route of caremanagement's financial-assistance API: `/errands/financial-assistance/...` — the type-specific view of
 * an errand (its ansökan data, warnings, SSBTEK, finalize …) and the catalogues that belong to the type.
 *
 * @param parts Path segments after `/errands/financial-assistance`, e.g. `errandId, 'warnings'`
 */
export const caremanagementFinancialAssistanceUrl = (...parts: string[]): string =>
  caremanagementUrl('errands', FINANCIAL_ASSISTANCE_TYPE_SLUG, ...parts);

/**
 * An errand's route under caremanagement's Lifecare integration — everything drakel does in Lifecare goes through
 * careM, which signs in, holds the session, resolves insats and personnummer from the errand, links what it
 * creates to the errand and logs every access itself.
 *
 * @param errandId The errand (careM id)
 * @param parts Path segments after `/lifecare`, e.g. `'decision', 'pdf'`
 */
export const caremanagementLifecareUrl = (errandId: string, ...parts: string[]): string =>
  caremanagementFinancialAssistanceUrl(errandId, 'lifecare', ...parts);
