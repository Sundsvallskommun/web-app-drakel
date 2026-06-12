import { Lookup } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService } from '@services/api-service';

export type LookupKind = 'CATEGORY' | 'STATUS' | 'TYPE' | 'ROLE' | 'CONTACT_REASON';

/** Fetches metadata lookups of a given kind from the backend proxy. */
export const getLookups = (kind: LookupKind): Promise<ServiceResponse<Lookup[]>> => {
  return apiService
    .get<ApiResponse<Lookup[]>>('metadata', { params: { kind } })
    .then((res) => ({ data: res.data.data }))
    .catch((e) => ({
      message: e.response?.data?.message,
      error: e.response?.status ?? 'UNKNOWN ERROR',
    }));
};

/** Convenience helper for the STATUS lookups used by the overview status filter. */
export const getStatuses = (): Promise<ServiceResponse<Lookup[]>> => getLookups('STATUS');
