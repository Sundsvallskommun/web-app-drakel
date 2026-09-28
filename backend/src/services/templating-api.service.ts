import { TEMPLATING_BASE_URL } from '@config';
import { gatewayAuthorization } from '@services/api-token.service';
import { upstreamErrorMapper } from '@utils/upstream-error';

import { HttpException } from '@/exceptions/HttpException';

import UpstreamApiService from './upstream-api.service';

/** Templating's failures, in the same shape as caremanagement's but named as Templating's. */
const templatingError = upstreamErrorMapper('Templating');

/**
 * Transport for the Templating service — on its own host when TEMPLATING_BASE_URL is set (e.g. Dokploy), called
 * without the gateway's token; otherwise through the WSO2 gateway with it. Build its URLs with templatingUrl.
 */
class TemplatingApiService extends UpstreamApiService {
  protected override async upstreamHeaders(): Promise<Record<string, string>> {
    return TEMPLATING_BASE_URL ? {} : gatewayAuthorization();
  }

  protected override toHttpException(error: unknown): HttpException {
    return templatingError(error);
  }
}

export default TemplatingApiService;
