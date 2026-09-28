import { API_BASE_URL } from '@config';

import { ApiName, apiPathSegments } from '@/config/api-config';
import { joinUrlSegments } from '@/utils/url-segments';

/**
 * An absolute URL to one of the subscribed APIs on the WSO2 gateway: `{API_BASE_URL}/{api}/{version}/{parts}`. Called
 * with the gateway's bearer token (see gatewayAuthorization).
 *
 * @param api The subscribed API, as listed in APIS
 * @param parts Path segments after the API's name and version — raw, each is encoded (see joinUrlSegments)
 */
export const gatewayUrl = (api: ApiName, ...parts: string[]): string => joinUrlSegments(API_BASE_URL, ...apiPathSegments(api), ...parts);

/**
 * An absolute URL to an API on its own host when one is configured (e.g. a Dokploy instance), called without the
 * gateway's token; otherwise on the WSO2 gateway like the rest.
 *
 * @param ownHost The API's own host, or empty to go through the gateway
 * @param api The subscribed API, as listed in APIS
 * @param parts Path segments after the host, or after the API's name and version on the gateway — raw, each is encoded
 */
export const ownHostOrGatewayUrl = (ownHost: string, api: ApiName, ...parts: string[]): string =>
  ownHost ? joinUrlSegments(ownHost, ...parts) : gatewayUrl(api, ...parts);
