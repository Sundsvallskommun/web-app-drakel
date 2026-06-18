import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Warning } from '@/data-contracts/caremanagement/data-contracts';

/** The two statuses a handläggare can set a warning to (acknowledge or close it). */
type WarningStatusUpdate = 'ACKNOWLEDGED' | 'CLOSED';

/** Warnings live under the financial-assistance view of an errand (not the generic errand resource). */
class CaremanagementWarningService {
  private apiService = new CaremanagementApiService();

  async readWarnings(errandId: string): Promise<ApiResponse<Warning[]>> {
    return this.apiService.get<Warning[]>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'warnings'),
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
