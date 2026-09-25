import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';

import { LifecareSectionStatus } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareSectionStatusView, toSectionStatusView } from '@/responses/lifecare-section-status.response';

/**
 * Which of the errand's Normberäkning, Beslut and Utbetalning are done, as Lifecare has them — the checks on the
 * tabs, read through careM. careM checks each on its own: the beräkning is slutlig, the beslut is saved, and an
 * utbetalning for the errand's month is registered; one Lifecare read failing leaves that check off, not the others.
 */
class ErrandLifecareSectionStatusService {
  private apiService = new CaremanagementApiService();

  async read(errandId: string): Promise<LifecareSectionStatusView> {
    const response = await this.apiService.get<LifecareSectionStatus>({ url: caremanagementLifecareUrl(errandId, 'section-status') });
    return toSectionStatusView(response.data);
  }
}

export default ErrandLifecareSectionStatusService;
