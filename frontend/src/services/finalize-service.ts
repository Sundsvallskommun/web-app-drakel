import { DecisionNotificationDto, FinalizeApiResponse, FinalizeResult } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/**
 * "Besluta och utbetala": finalizes the errand from the beslut saved in Lifecare and the utbetalning drafts,
 * then sends Lifecare's print of the beslut through the chosen channels — the only thing the input carries. A resolved result means the errand is decided — it lists the parts
 * after that which did not go through. A rejection (`error`, with the backend's `message`) means nothing
 * was finalized.
 */
export const finalizeErrand = (
  errandId: string,
  input: DecisionNotificationDto
): Promise<ServiceResponse<FinalizeResult>> =>
  apiService
    .post<FinalizeApiResponse>(`errands/${errandId}/finalize`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
