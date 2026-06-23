import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** A single entry in an errand's activity log. Defined locally mirroring the backend response. */
export interface ErrandEvent {
  id?: string;
  errandId?: string;
  /** HTTP (access log) or EVENT (domain-event change log). */
  source?: string;
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
  /** HTTP (access log) or EVENT (change log). */
  source?: string;
}

/** Fetches the activity log (event log) for an errand, optionally filtered by action and/or source. */
export const getErrandEvents = (
  errandId: string,
  filters: ErrandEventFilters = {}
): Promise<ServiceResponse<ErrandEvent[]>> => {
  const params = new URLSearchParams();
  if (filters.action) {
    params.set('action', filters.action);
  }
  if (filters.source) {
    params.set('source', filters.source);
  }
  const query = params.toString();
  return apiService
    .get<ApiResponse<ErrandEvent[]>>(`errands/${errandId}/events${query ? `?${query}` : ''}`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};
