import { ErrandCounts, ErrandCountsApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/**
 * Fetches the badge counts for an errand (notes, active warnings, and messages addressed to the handläggare that
 * haven't been marked read). Backed by caremanagement's unlogged count endpoints.
 */
export const getErrandCounts = (errandId: string): Promise<ServiceResponse<ErrandCounts>> =>
  unwrapData(apiService.get<ErrandCountsApiResponse>(apiPath`errands/${errandId}/counts`));
