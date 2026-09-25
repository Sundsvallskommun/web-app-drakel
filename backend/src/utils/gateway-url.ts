import { ApiName, getApiBase } from '@/config/api-config';
import { apiURL } from '@/utils/util';

/**
 * An absolute URL to one of the subscribed APIs on the WSO2 gateway: `{API_BASE_URL}/{api}/{version}/{parts}`.
 * Every upstream drakel calls is reached this way, with the gateway's bearer token (see gatewayAuthorization).
 *
 * @param api The subscribed API, as listed in APIS
 * @param parts Path segments after the API's name and version
 */
export const gatewayUrl = (api: ApiName, ...parts: string[]): string => apiURL(getApiBase(api), ...parts);

/**
 * An absolute URL to an API on its own host when one is configured (e.g. a Dokploy instance), called without the
 * gateway's token; otherwise on the WSO2 gateway like the rest.
 *
 * @param ownHost The API's own host, or empty to go through the gateway
 * @param api The subscribed API, as listed in APIS
 * @param parts Path segments after the host, or after the API's name and version on the gateway
 */
export const ownHostOrGatewayUrl = (ownHost: string, api: ApiName, ...parts: string[]): string =>
  ownHost ? [ownHost, ...parts].map(segment => segment.replace(/^\/+|\/+$/g, '')).join('/') : gatewayUrl(api, ...parts);
