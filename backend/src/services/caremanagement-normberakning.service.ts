import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { DraftIncomeRow, NormberakningDraft } from '@/data-contracts/caremanagement/data-contracts';

/**
 * The draft normberäkning lives under the financial-assistance view. It currently only carries the
 * income rows (no expenses/family/result — those are computed in Lifecare and not exposed here).
 */
class CaremanagementNormberakningService {
  private apiService = new CaremanagementApiService();

  async readDraft(errandId: string): Promise<ApiResponse<NormberakningDraft>> {
    return this.apiService.get<NormberakningDraft>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'normberakning', 'draft'),
    });
  }

  /**
   * Saves the edited income rows. `edited` is set so caremanagement's daily SSBTEK refresh preserves
   * the handläggare's changes instead of overwriting them.
   */
  async updateDraft(errandId: string, rows: DraftIncomeRow[]): Promise<ApiResponse<NormberakningDraft>> {
    return this.apiService.put<NormberakningDraft>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'normberakning', 'draft'),
      data: { errandId, edited: true, rows },
    });
  }
}

export default CaremanagementNormberakningService;
