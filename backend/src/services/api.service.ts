import axios from 'axios';

import { HttpException } from '@/exceptions/HttpException';
import { logUpstreamFailure } from '@/utils/upstream-error';

import { gatewayAuthorization } from './api-token.service';
import UpstreamApiService from './upstream-api.service';

const NOT_FOUND = 404;

/**
 * A failed gateway call as drakel answers it: a 404 stays a 404, anything else is logged (status and code only) and
 * becomes a 500 — the callers of the gateway APIs (Citizen, Messaging, Active Directory) act on nothing finer.
 */
const gatewayError = (error: unknown): HttpException => {
  if (axios.isAxiosError(error) && error.response?.status === NOT_FOUND) {
    return new HttpException(NOT_FOUND, 'Not found');
  }
  // NOTE: did you subscribe to the API called?
  logUpstreamFailure('gateway', error);
  return new HttpException(500, 'Internal server error from gateway');
};

/** Transport for the APIs reached through the WSO2 gateway with its bearer token; build their URLs with gatewayUrl. */
class ApiService extends UpstreamApiService {
  protected override async upstreamHeaders(): Promise<Record<string, string>> {
    return gatewayAuthorization();
  }

  protected override toHttpException(error: unknown): HttpException {
    return gatewayError(error);
  }
}

export default ApiService;
