import { HttpException } from '@exceptions/HttpException';
import { LifecareCalculationForEditRaw, LifecareCalculationRaw, LifecareCalculationTypeRaw } from '@interfaces/lifecare-calculation.interface';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import LifecareJobStimulusService from '@services/lifecare-job-stimulus.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { buildCalculationUpdate, householdSizeOfSaved, withJobStimulusIncomes } from '@utils/lifecare-calculation';
import { needsRecount, toLifecareDraftView, withEnteredIncomes } from '@utils/lifecare-calculation-rows';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { NormberakningDraft, NormberakningTypes, NormTypeOption } from '@/responses/normberakning.response';

/** A change to a saved beräkning: the beräkning as the handläggare entered it in, the changed one out. */
export type CalculationChange = (calculation: LifecareCalculationRaw, forEdit: LifecareCalculationForEditRaw) => LifecareCalculationRaw;

const toTypeOptions = (types: LifecareCalculationTypeRaw[]): NormTypeOption[] =>
  types.filter(type => type.isActive).map(type => ({ code: String(type.id), displayName: type.text }));

/**
 * The errand's beräkning once it is saved in Lifecare, read and changed there directly — Lifecare owns it
 * from then on. Every change goes the way Lifecare's web app saves one: read for edit, change, have Lifecare
 * place the members on the norm and mark jobbstimulans, count jobbstimulans on the incomes, then
 * `Calculation/Update`. Reads and writes are logged on the errand.
 */
class LifecareCalculationEditService {
  private calculations = new LifecareCalculationsService();
  private jobStimulus = new LifecareJobStimulusService();
  private serviceIds = new LifecareServiceIdService();
  private accessLog = new LifecareAccessLogService();

  /** The saved beräkning in the tab's draft shape. */
  async readDraftView(errandId: string, calculationId: number, applicationMonth: string | undefined): Promise<NormberakningDraft> {
    const forEdit = await this.calculations.readForEdit(calculationId);
    await this.accessLog.logRead(errandId, {
      target: 'CALCULATION',
      description: 'Läste normberäkningen i Lifecare',
      lifecareId: String(calculationId),
    });
    return toLifecareDraftView(forEdit, applicationMonth);
  }

  /** Lifecare's own inkomst-, utgifts- and levnadskostnadstyper for the beräkning. */
  async readTypes(calculationId: number): Promise<NormberakningTypes> {
    const forEdit = await this.calculations.readForEdit(calculationId);
    return {
      incomeTypes: toTypeOptions(forEdit.incomeTypes),
      costTypes: toTypeOptions(forEdit.expenseTypes),
      livingCostTypes: toTypeOptions(forEdit.specialExpenseTypes),
    };
  }

  /**
   * Makes `change` to the saved beräkning and saves it in Lifecare; `finalize` saves it as slutlig, after which
   * Lifecare allows no change. Answers with the beräkning as Lifecare counted it.
   */
  async change(errandId: string, calculationId: number, change: CalculationChange, finalize = false): Promise<LifecareCalculationRaw> {
    const [serviceId, forEdit] = await Promise.all([this.serviceIds.resolve(errandId), this.calculations.readForEdit(calculationId)]);
    if (forEdit.calculation.isFinalized) {
      throw new HttpException(422, 'Normberäkningen är sparad som slutlig i Lifecare och kan inte ändras.');
    }
    const jobStimulus = await this.jobStimulus.readForService(serviceId);
    await this.accessLog.logRead(errandId, { target: 'CALCULATION', description: 'Läste beräkningsunderlag i Lifecare' });

    const changed = change(withEnteredIncomes(forEdit.calculation, forEdit.incomeTypes), forEdit);
    const placed = await this.withCountedAmounts(forEdit.calculation, await this.calculations.placeAndMark(changed, jobStimulus));
    const calculation = withJobStimulusIncomes(placed, forEdit.incomeTypes);
    const updated = await this.calculations.update(calculationId, buildCalculationUpdate(calculation, householdSizeOfSaved(calculation), finalize));
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.UPDATE, {
      target: 'CALCULATION',
      description: finalize ? 'Sparade normberäkningen som slutlig i Lifecare' : 'Ändrade normberäkningen i Lifecare',
      lifecareId: String(calculationId),
    });
    return updated;
  }

  /**
   * Has Lifecare count the amount of every member whose days in the household or normintervall changed — the
   * amount follows both, by Lifecare's own rules (`Calculation/GetAmount`).
   */
  private async withCountedAmounts(before: LifecareCalculationRaw, calculation: LifecareCalculationRaw): Promise<LifecareCalculationRaw> {
    const calculationPersons = await Promise.all(
      calculation.calculationPersons.map(async member =>
        needsRecount(before, member)
          ? { ...member, amount: await this.calculations.amountFor(member, calculation.startDate, calculation.endDate) }
          : member,
      ),
    );
    return { ...calculation, calculationPersons };
  }
}

export default LifecareCalculationEditService;
