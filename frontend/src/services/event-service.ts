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

/**
 * One handläggare's activity across every errand. `total` counts everything matching the filters, while
 * `events` is caremanagement's capped listing — the two differ when the period holds more than it returns.
 */
export interface ActorEventLog {
  events: ErrandEvent[];
  total: number;
}

/** What a logguppföljning is searched on. The actor (AD account) is the only required part. */
export interface ActorEventFilters {
  actor: string;
  action?: string;
  source?: string;
  /** ISO date-time bounds; narrowing the period is how a capped listing is read in full. */
  from?: string;
  to?: string;
}

/** Optional server-side filters for the event log. */
export interface ErrandEventFilters {
  action?: string;
  /** HTTP (access log) or EVENT (change log). */
  source?: string;
}

/** Looks up one handläggare's activity across every errand (logguppföljning). */
export const getActorEvents = (filters: ActorEventFilters): Promise<ServiceResponse<ActorEventLog>> => {
  const params = new URLSearchParams({ actor: filters.actor });
  (['action', 'source', 'from', 'to'] as const).forEach((key) => {
    const value = filters[key];
    if (value) {
      params.set(key, value);
    }
  });
  return apiService
    .get<ApiResponse<ActorEventLog>>(`admin/event-log?${params.toString()}`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

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
