import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** A single entry in an errand's activity log. Defined locally mirroring the backend response. */
export interface ErrandEvent {
  id?: string;
  errandId?: string;
  /** READ / CREATE / UPDATE / DELETE. */
  action?: string;
  /** What the event concerns (e.g. errand, decisions, financial-assistance/calculation/draft/incomes). */
  target?: string;
  description?: string;
  httpMethod?: string;
  requestPath?: string;
  /** Who performed the action (null when no actor was captured). */
  actor?: string;
  actorType?: string;
  statusCode?: number;
  created?: string;
}

/** Optional server-side filters for the event log. */
export interface ErrandEventFilters {
  action?: string;
}

/** Fetches the activity log (event log) for an errand, optionally filtered by action. */
export const getErrandEvents = (
  errandId: string,
  filters: ErrandEventFilters = {}
): Promise<ServiceResponse<ErrandEvent[]>> => {
  const query = filters.action ? `?action=${encodeURIComponent(filters.action)}` : '';
  return apiService
    .get<ApiResponse<ErrandEvent[]>>(`errands/${errandId}/events${query}`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};
