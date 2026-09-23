import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** Whether the applicant has a reachable digital mailbox (so the "Digital brevlåda" channel is offered). */
export const getDigitalMailbox = (errandId: string): Promise<ServiceResponse<boolean>> =>
  apiService
    .get<ApiResponse<{ available: boolean }>>(`errands/${errandId}/digital-mailbox`)
    .then((res) => ({ data: res.data.data.available }))
    .catch(toServiceError);
