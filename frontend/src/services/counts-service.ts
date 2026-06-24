import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** Per-errand badge counts. Backed by caremanagement's unlogged count endpoints. */
export interface ErrandCounts {
  notes: number;
  warnings: number;
  bevakningar: number;
  /** Messages addressed to the handläggare that haven't been marked read. */
  unreadMessages: number;
}

/** Fetches the badge counts for an errand (notes, active warnings, bevakningar). */
export const getErrandCounts = (errandId: string): Promise<ServiceResponse<ErrandCounts>> =>
  apiService
    .get<ApiResponse<ErrandCounts>>(`errands/${errandId}/counts`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
