import { MUNICIPALITY_ID } from '@config';

import { gatewayUrl } from './gateway-url';

/**
 * Builds an absolute Templating URL on the WSO2 gateway, scoped to the configured municipality. Templating's paths
 * are `/{municipalityId}/...`, so the municipality is injected here and callers pass the rest.
 *
 * @param parts Path segments appended after the municipality scope
 */
export const templatingUrl = (...parts: string[]): string => gatewayUrl('templating', MUNICIPALITY_ID, ...parts);
