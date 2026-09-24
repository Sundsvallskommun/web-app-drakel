import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementSsbtekService from '@services/caremanagement-ssbtek.service';
import { toSsbtekPaymentsView } from '@utils/ssbtek-payments';

import { SsbtekQueryDto } from '@/dtos/ssbtek.dto';
import { SsbtekPaymentsView } from '@/responses/ssbtek.response';

/** What SSBTEK reports for an errand's sökande or medsökande, read through careM. */
class ErrandSsbtekService {
  private errandService = new CaremanagementErrandService();
  private ssbtekService = new CaremanagementSsbtekService();

  /**
   * The payments SSBTEK reports in the period. The errand is given as the page's route segment — its errand
   * number or its id — and careM's SSBTEK read takes the id.
   */
  async readPayments(errandIdentifier: string, query: SsbtekQueryDto): Promise<SsbtekPaymentsView> {
    const errand = await this.errandService.getErrandByIdentifier(errandIdentifier);
    const basis = await this.ssbtekService.readBasis(errand.data.id ?? errandIdentifier, query);
    return toSsbtekPaymentsView(basis.data);
  }
}

export default ErrandSsbtekService;
