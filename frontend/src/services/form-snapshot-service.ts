import { FormSnapshot } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/**
 * Fetches the captured application form snapshot for an errand — the structured "as it was" sammanställning
 * of the citizen's application. Resolves with `data: null` when no snapshot was captured (the BFF maps the
 * caremanagement 404 to a clean empty result); any other failure is an `error`.
 */
export const getFormSnapshot = (errandId: string): Promise<ServiceResponse<FormSnapshot | null>> =>
  unwrapData(apiService.get<ApiResponse<FormSnapshot | null>>(apiPath`errands/${errandId}/form-snapshot`));
