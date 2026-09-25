import { MUNICIPALITY_ID, TEMPLATING_BASE_URL } from '@config';

import { ownHostOrGatewayUrl } from './gateway-url';

/**
 * Builds an absolute Templating URL — on TEMPLATING_BASE_URL when set, otherwise on the WSO2 gateway — scoped to the
 * configured municipality. Templating's paths are `/{municipalityId}/...`, so the municipality is injected here and
 * callers pass the rest.
 *
 * @param parts Path segments appended after the municipality scope
 */
export const templatingUrl = (...parts: string[]): string => ownHostOrGatewayUrl(TEMPLATING_BASE_URL, 'templating', MUNICIPALITY_ID, ...parts);
