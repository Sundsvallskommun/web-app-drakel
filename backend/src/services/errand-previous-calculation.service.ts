import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';

import { NormberakningPreviousCalculation } from '@/data-contracts/caremanagement/data-contracts';
import { PreviousCalculationView } from '@/responses/previous-calculation.response';

/**
 * The beräkning preceding the errand's own period — the "Jämför med föregående månad" view — read through careM,
 * which picks it among the insats's beräkningar in Lifecare and logs the read.
 */
class ErrandPreviousCalculationService {
  private apiService = new CaremanagementApiService();

  /** The previous beräkning, or null when the insats has none before the errand's period (careM's 204). */
  async read(errandId: string): Promise<PreviousCalculationView | null> {
    return this.apiService.getOrNull<NormberakningPreviousCalculation>({ url: caremanagementLifecareUrl(errandId, 'normberakning', 'previous') });
  }
}

export default ErrandPreviousCalculationService;
