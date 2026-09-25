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
