import {
  ActorEventLog,
  ActorEventLogApiResponse,
  ErrandEvent,
  ErrandEventsApiResponse,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

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

/**
 * Looks up one handläggare's activity across every errand (logguppföljning). `total` counts everything matching
 * the filters, while `events` is caremanagement's capped listing — the two differ when the period holds more
 * than it returns.
 */
export const getActorEvents = (filters: ActorEventFilters): Promise<ServiceResponse<ActorEventLog>> => {
  const params = new URLSearchParams({ actor: filters.actor });
  (['action', 'source', 'from', 'to'] as const).forEach((key) => {
    const value = filters[key];
    if (value) {
      params.set(key, value);
    }
  });
  return unwrapData(apiService.get<ActorEventLogApiResponse>(`admin/actor-activity?${params.toString()}`));
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
  return unwrapData(
    apiService.get<ErrandEventsApiResponse>(`${apiPath`errands/${errandId}/events`}${query ? `?${query}` : ''}`)
  );
};
