import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementSsbtekService from '@services/caremanagement-ssbtek.service';
import { httpStatusOf } from '@utils/http-error-status';
import { logger } from '@utils/logger';
import { ChildBasis, CoApplicantBasis, toSsbtekPaymentsView } from '@utils/ssbtek-payments';

import { Child } from '@/data-contracts/caremanagement/data-contracts';
import { SsbtekPeriodQueryDto } from '@/dtos/ssbtek.dto';
import { SsbtekPaymentsView } from '@/responses/ssbtek.response';

const NOT_FOUND = 404;

/** A child's name as the ansökan gives it, or undefined when it gives none. */
const childNameOf = (child: Child): string | undefined => [child.firstName, child.lastName].filter(Boolean).join(' ') || undefined;

/** What SSBTEK reports for an errand's household — its sökande, any medsökande and children — read through careM. */
class ErrandSsbtekService {
  private errandService = new CaremanagementErrandService();
  private ssbtekService = new CaremanagementSsbtekService();

  /**
   * The payments SSBTEK reports to the household in the period. The errand is given as the page's route segment —
   * its errand number or its id — and careM's SSBTEK read takes the id. The household is read side by side: the
   * sökande failing fails the whole, the medsökande or a child failing only leaves their payments out.
   */
  async readPayments(errandIdentifier: string, period: SsbtekPeriodQueryDto): Promise<SsbtekPaymentsView> {
    const errand = await this.errandService.getErrandByIdentifier(errandIdentifier);
    const errandId = errand.data.id ?? errandIdentifier;
    const [applicant, coApplicant, children] = await Promise.all([
      this.ssbtekService.readBasis(errandId, 'APPLICANT', period),
      this.readCoApplicant(errandId, period),
      this.readChildren(errandId, period),
    ]);
    return toSsbtekPaymentsView(applicant.data, coApplicant, children);
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

  /** The SSBTEK basis of each child the ansökan names — by its partyId, as careM reads children. */
  private async readChildren(errandId: string, period: SsbtekPeriodQueryDto): Promise<ChildBasis[]> {
    const view = await this.errandService.getFinancialAssistanceView(errandId);
    const children = (view.data.data?.children ?? []).flatMap(child => (child.partyId ? [{ name: childNameOf(child), partyId: child.partyId }] : []));
    return Promise.all(children.map(({ name, partyId }) => this.readChild(errandId, name, partyId, period)));
  }

  /** One child's basis; a child SSBTEK cannot be read for is kept, without a basis, so the page can say so. */
  private async readChild(errandId: string, name: string | undefined, partyId: string, period: SsbtekPeriodQueryDto): Promise<ChildBasis> {
    try {
      const response = await this.ssbtekService.readBasis(errandId, 'CHILD', period, partyId);
      return { name, basis: response.data };
    } catch (error) {
      const status = httpStatusOf(error);
      logger.warn(`SSBTEK could not be read for a child on errand ${errandId} (status ${String(status ?? 'unknown')})`);
      return { name };
    }
  }
}

export default ErrandSsbtekService;
