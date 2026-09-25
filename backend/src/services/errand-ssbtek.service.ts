import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementSsbtekService from '@services/caremanagement-ssbtek.service';
import { httpStatusOf } from '@utils/http-error-status';
import { logger } from '@utils/logger';
import { CoApplicantBasis, toSsbtekPaymentsView } from '@utils/ssbtek-payments';

import { SsbtekPeriodQueryDto } from '@/dtos/ssbtek.dto';
import { SsbtekPaymentsView } from '@/responses/ssbtek.response';

const NOT_FOUND = 404;

/** What SSBTEK reports for an errand's household — its sökande and any medsökande — read through careM. */
class ErrandSsbtekService {
  private errandService = new CaremanagementErrandService();
  private ssbtekService = new CaremanagementSsbtekService();

  /**
   * The payments SSBTEK reports to the household in the period. The errand is given as the page's route segment —
   * its errand number or its id — and careM's SSBTEK read takes the id. The sökande and medsökande are read side
   * by side; the sökande failing fails the whole, the medsökande failing only leaves their payments out.
   */
  async readPayments(errandIdentifier: string, period: SsbtekPeriodQueryDto): Promise<SsbtekPaymentsView> {
    const errand = await this.errandService.getErrandByIdentifier(errandIdentifier);
    const errandId = errand.data.id ?? errandIdentifier;
    const [applicant, coApplicant] = await Promise.all([
      this.ssbtekService.readBasis(errandId, 'APPLICANT', period),
      this.readCoApplicant(errandId, period),
    ]);
    return toSsbtekPaymentsView(applicant.data, coApplicant);
  }

  /** The medsökandes basis — careM answering 404 means the errand has no medsökande. */
  private async readCoApplicant(errandId: string, period: SsbtekPeriodQueryDto): Promise<CoApplicantBasis> {
    try {
      const response = await this.ssbtekService.readBasis(errandId, 'CO_APPLICANT', period);
      return { kind: 'READ', basis: response.data };
    } catch (error) {
      const status = httpStatusOf(error);
      if (status === NOT_FOUND) {
        return { kind: 'NONE' };
      }
      logger.warn(`SSBTEK could not be read for the medsökande on errand ${errandId} (status ${String(status ?? 'unknown')})`);
      return { kind: 'UNAVAILABLE' };
    }
  }
}

export default ErrandSsbtekService;
