import { FinalizeApiResponse, FinalizeErrandDto, FinalizeResult } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/**
 * "Besluta och utbetala": finalizes the errand from the saved beslut and utbetalning drafts, then sends the
 * beslut through the chosen channels. A resolved result means the errand is decided — it lists the parts
 * after that which did not go through. A rejection (`error`, with the backend's `message`) means nothing
 * was finalized.
 */
export const finalizeErrand = (errandId: string, input: FinalizeErrandDto): Promise<ServiceResponse<FinalizeResult>> =>
  apiService
    .post<FinalizeApiResponse>(`errands/${errandId}/finalize`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
