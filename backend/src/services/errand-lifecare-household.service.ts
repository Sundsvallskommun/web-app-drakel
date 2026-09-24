import { HttpException } from '@exceptions/HttpException';
import { LifecareCalculationForEditRaw } from '@interfaces/lifecare-calculation.interface';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareCalculationEditService from '@services/lifecare-calculation-edit.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import LifecareHouseholdsService from '@services/lifecare-households.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { addPerson } from '@utils/lifecare-calculation-rows';
import { pickHousehold, toHouseholdView } from '@utils/lifecare-household';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { HouseholdCandidateView, LifecareHouseholdView } from '@/responses/lifecare-household.response';

/**
 * The sökandes hushåll in Lifecare and who of it the errand's beräkning takes in. Only once the beräkning is
 * in Lifecare: before that careM's draft holds the persons from the ansökan. Taking a member in, or adding a
 * bonusbarn, is done the way Lifecare's web app does it (capture 2026-09-24): `AddBonusChildToHousehold` for a
 * bonusbarn, then `GetProposalForPerson` for the member's row, then the beräkning is saved.
 */
class ErrandLifecareHouseholdService {
  private errandService = new CaremanagementErrandService();
  private calculations = new LifecareCalculationsService();
  private households = new LifecareHouseholdsService();
  private edit = new LifecareCalculationEditService();
  private serviceIds = new LifecareServiceIdService();
  private accessLog = new LifecareAccessLogService();

  async read(errandId: string): Promise<LifecareHouseholdView> {
    const forEdit = await this.calculations.readForEdit(await this.calculationIdOf(errandId));
    const household = await this.householdOf(errandId, forEdit);
    return toHouseholdView(household, forEdit.calculation);
  }

  /** Persons Lifecare finds for the search text, to add as a bonusbarn. */
  async candidates(errandId: string, filter: string): Promise<HouseholdCandidateView[]> {
    await this.calculationIdOf(errandId);
    const found = await this.households.findCandidates(filter.trim());
    await this.accessLog.logRead(errandId, { target: 'HOUSEHOLD', description: 'Sökte personer i Lifecare' });
    return found.map(person => ({ personId: person.personId, personalNumber: person.personIdFormatted, name: person.name }));
  }

  /** Adds the person as a bonusbarn to the hushåll — unless already one — and takes them into the beräkning. */
  async addBonusChild(errandId: string, personId: string): Promise<void> {
    const calculationId = await this.calculationIdOf(errandId);
    const [serviceId, forEdit] = await Promise.all([this.serviceIds.resolve(errandId), this.calculations.readForEdit(calculationId)]);
    const household = await this.householdOf(errandId, forEdit);
    if (!household?.householdBonusChildren.some(child => child.personId === personId && !child.markedForRemoval)) {
      await this.households.addBonusChild(serviceId, personId);
      await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
        target: 'HOUSEHOLD',
        description: 'Lade till ett bonusbarn i hushållet i Lifecare',
      });
    }
    await this.takeIn(errandId, calculationId, forEdit, personId, true);
  }

  /** Takes a member or bonusbarn of the hushåll into the beräkning. */
  async includePerson(errandId: string, personId: string): Promise<void> {
    const calculationId = await this.calculationIdOf(errandId);
    const forEdit = await this.calculations.readForEdit(calculationId);
    const person = toHouseholdView(await this.householdOf(errandId, forEdit), forEdit.calculation).persons.find(
      candidate => candidate.personId === personId,
    );
    if (!person) {
      throw new HttpException(422, 'Personen finns inte i hushållet i Lifecare.');
    }
    await this.takeIn(errandId, calculationId, forEdit, personId, person.bonusChild);
  }

  private async takeIn(errandId: string, calculationId: number, forEdit: LifecareCalculationForEditRaw, personId: string, bonusChild: boolean) {
    const { calculation } = forEdit;
    const proposed = await this.calculations.proposalForPerson({
      startDate: calculation.startDate,
      endDate: calculation.endDate,
      normId: calculation.normId,
      aktualiseringId: 0,
      date: calculation.date,
      calculationNotBeforeDate: forEdit.calculationNotBeforeDate ?? '',
      calculationDateVisible: true,
      onCopy: false,
      person: personId,
    });
    await this.edit.change(errandId, calculationId, current => addPerson(current, proposed, bonusChild));
  }

  /** The hushåll of the beräkning's sökande — its first member — for the beräkning's period. Reading it is logged. */
  private async householdOf(errandId: string, forEdit: LifecareCalculationForEditRaw) {
    const applicant = forEdit.calculation.calculationPersons[0];
    if (!applicant) {
      return undefined;
    }
    const listed = await this.households.listForPerson(applicant.personId);
    await this.accessLog.logRead(errandId, { target: 'HOUSEHOLD', description: 'Läste hushållet i Lifecare' });
    return pickHousehold(listed.households, forEdit.calculation.startDate || forEdit.calculation.date);
  }

  private async calculationIdOf(errandId: string): Promise<number> {
    const view = await this.errandService.getFinancialAssistanceView(errandId);
    const calculationId = view.data?.data?.lifecareCalculationId ?? undefined;
    if (calculationId === undefined) {
      throw new HttpException(422, 'Spara normberäkningen i Lifecare innan hushållet ändras.');
    }
    return calculationId;
  }
}

export default ErrandLifecareHouseholdService;
