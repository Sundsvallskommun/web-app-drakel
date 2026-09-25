import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { httpStatusOf } from '@utils/http-error-status';

import { NormberakningDraft } from '@/data-contracts/caremanagement/data-contracts';

const NOT_FOUND = 404;

/**
 * Whether the handläggare changed the household size (gemensamma kostnader) on the errand's normberäkning — what
 * finalize records as `householdSizeChanged`. careM does not work it out itself (a finalize without the flag
 * records false), so it is read from careM's normberäkning: its draft until the beräkning is saved in Lifecare,
 * Lifecare's beräkning after that.
 */
class CaremanagementHouseholdSizeService {
  private apiService = new CaremanagementApiService();

  /** False when the errand has no normberäkning at all (careM answers 404): there is no size to have changed. */
  async readHouseholdSizeChanged(errandId: string): Promise<boolean> {
    try {
      const response = await this.apiService.get<NormberakningDraft>({ url: caremanagementLifecareUrl(errandId, 'normberakning') });
      return response.data.hasCustomHouseholdSize ?? false;
    } catch (error) {
      if (httpStatusOf(error) === NOT_FOUND) {
        return false;
      }
      throw error;
    }
  }
}

export default CaremanagementHouseholdSizeService;
