import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementSsbtekService from '@services/caremanagement-ssbtek.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import CitizenService from '@services/citizen.service';
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
  private stakeholderService = new CaremanagementStakeholderService();
  private citizenService = new CitizenService();

  /**
   * The payments SSBTEK reports to the household in the period. The errand is given as the page's route segment —
   * its errand number or its id — and careM's SSBTEK read takes the id. The household is read side by side: the
   * sökande failing fails the whole, the medsökande or a child failing only leaves their payments out.
   */
  async readPayments(errandIdentifier: string, period: SsbtekPeriodQueryDto): Promise<SsbtekPaymentsView> {
    const errand = await this.errandService.getErrandByIdentifier(errandIdentifier);
    const errandId = errand.data.id ?? errandIdentifier;
    const [applicant, coApplicant, children, personalNumbers] = await Promise.all([
      this.ssbtekService.readBasis(errandId, 'APPLICANT', period),
      this.readCoApplicant(errandId, period),
      this.readChildren(errandId, period),
      this.readAdultsPersonalNumbers(errandId),
    ]);
    return toSsbtekPaymentsView(
      { basis: applicant.data, personalNumber: personalNumbers.applicant },
      coApplicant.kind === 'READ' ? { ...coApplicant, personalNumber: personalNumbers.coApplicant } : coApplicant,
      children,
    );
  }

  /**
   * The personnummer of the sökande and medsökande, looked up in Citizen from their partyIds — for the table's
   * Personnummer column. Best-effort: one that cannot be looked up is left out rather than failing the page.
   */
  private async readAdultsPersonalNumbers(errandId: string): Promise<{ applicant?: string; coApplicant?: string }> {
    try {
      const partyIds = await this.stakeholderService.readHouseholdPartyIds(errandId);
      const [applicant, coApplicant] = await Promise.all([this.personalNumberOf(partyIds.applicant), this.personalNumberOf(partyIds.coApplicant)]);
      return { applicant, coApplicant };
    } catch {
      logger.warn(`The household's personnummer could not be looked up for SSBTEK on errand ${errandId}`);
      return {};
    }
  }

  /** A person's personnummer from Citizen, or undefined when there is no partyId or Citizen does not know it. */
  private async personalNumberOf(partyId: string | undefined): Promise<string | undefined> {
    return partyId ? ((await this.citizenService.getPersonnumber(partyId)) ?? undefined) : undefined;
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

  /** One child's basis and personnummer; a child SSBTEK cannot be read for is kept, without a basis, so the page can say so. */
  private async readChild(errandId: string, name: string | undefined, partyId: string, period: SsbtekPeriodQueryDto): Promise<ChildBasis> {
    const personalNumber = await this.personalNumberOf(partyId);
    try {
      const response = await this.ssbtekService.readBasis(errandId, 'CHILD', period, partyId);
      return { name, personalNumber, basis: response.data };
    } catch (error) {
      const status = httpStatusOf(error);
      logger.warn(`SSBTEK could not be read for a child on errand ${errandId} (status ${String(status ?? 'unknown')})`);
      return { name, personalNumber };
    }
  }
}

export default ErrandSsbtekService;
