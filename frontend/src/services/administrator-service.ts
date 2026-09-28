import { Administrator, AdministratorsApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, mapData } from '@services/api-service';

/**
 * Fetches the handläggare roster (empty when AD is unavailable). `username` is the AD account, i.e. an
 * errand's assignedUserId.
 */
export const getAdministrators = (): Promise<ServiceResponse<Administrator[]>> =>
  mapData(apiService.get<AdministratorsApiResponse>('administrators'), (administrators) => administrators ?? []);
