import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { ErrandEvent } from '@/data-contracts/caremanagement/data-contracts';

/** Optional server-side filters for the errand event log. */
export interface ErrandEventFilters {
  action?: string;
  actor?: string;
  /** HTTP (access log: who read/touched) or EVENT (domain-event change log: what changed, incl. system/process). */
  source?: string;
}

/** Reads the who/what/when activity log (event log) of an errand. */
class CaremanagementEventService {
  private apiService = new CaremanagementApiService();

  async readEvents(errandId: string, filters: ErrandEventFilters = {}): Promise<ApiResponse<ErrandEvent[]>> {
    return this.apiService.get<ErrandEvent[]>({
      url: caremanagementUrl('errands', errandId, 'events'),
      // Undefined params are dropped by axios, so an empty filter reads the full log.
      params: { action: filters.action, actor: filters.actor, source: filters.source },
    });
  }
}

export default CaremanagementEventService;
