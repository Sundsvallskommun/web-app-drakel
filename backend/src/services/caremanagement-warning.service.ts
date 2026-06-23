import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Warning, WarningCount } from '@/data-contracts/caremanagement/data-contracts';

/** The statuses a handläggare can set a warning to: re-open it, acknowledge it or close it. */
type WarningStatusUpdate = 'OPEN' | 'ACKNOWLEDGED' | 'CLOSED';

/** Warnings live under the financial-assistance view of an errand (not the generic errand resource). */
class CaremanagementWarningService {
  private apiService = new CaremanagementApiService();

  async readWarnings(errandId: string): Promise<ApiResponse<Warning[]>> {
    return this.apiService.get<Warning[]>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'warnings'),
    });
  }

  /** The active-warning count (OPEN/ACKNOWLEDGED only) for the errand (unlogged — safe to poll for a badge). */
  async readCount(errandId: string): Promise<ApiResponse<WarningCount>> {
    return this.apiService.get<WarningCount>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'warnings', 'count'),
    });
  }

  /** Acknowledges or closes a warning. The status is passed as a query param (caremanagement takes no body). */
  async updateWarningStatus(
    errandId: string,
    warningId: string,
    status: WarningStatusUpdate,
  ): Promise<ApiResponse<Warning>> {
    return this.apiService.patch<Warning>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'warnings', warningId),
      params: { status },
    });
  }
}

export default CaremanagementWarningService;
