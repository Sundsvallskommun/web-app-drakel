import { LifecareCalculationApiResponse, LifecareCalculationView } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/** The errand's normberäkning as it stands in Lifecare; null while none has been saved. */
export const getLifecareCalculation = (errandId: string): Promise<ServiceResponse<LifecareCalculationView | null>> =>
  apiService
    .get<LifecareCalculationApiResponse>(`errands/${errandId}/lifecare-calculation`)
    .then((res) => ({ data: res.data.data ?? null }))
    .catch(toServiceError);

/**
 * Saves the errand's draft normberäkning in Lifecare — created the first time, changed after that — and
 * answers with Lifecare's count of it. `finalize` saves it as slutlig, after which Lifecare allows no change.
 * On a refusal (`error`) `message` says why.
 */
export const saveLifecareCalculation = (
  errandId: string,
  finalize = false
): Promise<ServiceResponse<LifecareCalculationView>> =>
  apiService
    .post<LifecareCalculationApiResponse>(`errands/${errandId}/lifecare-calculation`, { finalize })
    .then((res) => (res.data.data ? { data: res.data.data } : { error: true }))
    .catch(toServiceError);
