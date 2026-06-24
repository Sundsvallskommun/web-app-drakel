import { FormSnapshot } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * Fetches the captured application form snapshot for an errand — the structured "as it was" sammanställning
 * of the citizen's application. Resolves with `data: null` when no snapshot was captured (the BFF maps the
 * caremanagement 404 to a clean empty result).
 */
export const getFormSnapshot = (errandId: string): Promise<ServiceResponse<FormSnapshot | null>> =>
  apiService
    .get<ApiResponse<FormSnapshot | null>>(`errands/${errandId}/form-snapshot`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
