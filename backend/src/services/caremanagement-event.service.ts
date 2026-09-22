import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { ActorEventLog, ErrandEventEntry } from '@/data-contracts/caremanagement/data-contracts';

/** Optional server-side filters for the errand event log. */
interface ErrandEventFilters {
  action?: string;
  actor?: string;
  /** HTTP (access log: who read/touched) or EVENT (domain-event change log: what changed, incl. system/process). */
  source?: string;
}

/** Filters for one actor's activity across every errand. `actor` is the AD account and is required. */
interface ActorEventFilters {
  action?: string;
  source?: string;
  /** ISO date-time; narrows the period, which is how a truncated listing is read in full. */
  from?: string;
  to?: string;
}

/** Reads the who/what/when activity log (event log) of an errand, and of one actor across all errands. */
class CaremanagementEventService {
  private apiService = new CaremanagementApiService();

  async readEvents(errandId: string, filters: ErrandEventFilters = {}): Promise<ApiResponse<ErrandEventEntry[]>> {
    return this.apiService.get<ErrandEventEntry[]>({
      url: caremanagementUrl('errands', errandId, 'events'),
      // Undefined params are dropped by axios, so an empty filter reads the full log.
      params: { action: filters.action, actor: filters.actor, source: filters.source },
    });
  }

  /**
   * One handläggare's activity across every errand in the namespace, newest first.
   *
   * The response carries `total` alongside the events because caremanagement caps the listing: the two
   * differing means the period holds more than was returned, and only a narrower from/to shows the rest.
   */
  async readActorEvents(actor: string, filters: ActorEventFilters = {}): Promise<ApiResponse<ActorEventLog>> {
    return this.apiService.get<ActorEventLog>({
      url: caremanagementUrl('events'),
      params: { actor, action: filters.action, source: filters.source, from: filters.from, to: filters.to },
    });
  }
}

export default CaremanagementEventService;
