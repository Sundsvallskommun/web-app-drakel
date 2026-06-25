import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** A handläggare from Active Directory. `username` is the AD account, i.e. an errand's assignedUserId. */
export interface Administrator {
  username: string;
  displayName: string;
  description?: string;
}

/** Fetches the handläggare roster (empty when AD is unavailable). */
export const getAdministrators = (): Promise<ServiceResponse<Administrator[]>> =>
  apiService
    .get<ApiResponse<Administrator[]>>('administrators')
    .then((res) => ({ data: res.data.data ?? [] }))
    .catch(toServiceError);
