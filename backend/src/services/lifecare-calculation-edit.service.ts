import { HttpException } from '@exceptions/HttpException';
import { LifecareCalculationForEditRaw, LifecareCalculationRaw, LifecareCalculationTypeRaw } from '@interfaces/lifecare-calculation.interface';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import LifecareJobStimulusService from '@services/lifecare-job-stimulus.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { buildCalculationUpdate, householdSizeOfSaved, withJobStimulusIncomes } from '@utils/lifecare-calculation';
import { householdSizeChanged, needsRecount, sharedCostShare, toLifecareDraftView, withEnteredIncomes } from '@utils/lifecare-calculation-rows';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { NormberakningDraft, NormberakningTypes, NormTypeOption } from '@/responses/normberakning.response';

/** A change to a saved beräkning: the beräkning as the handläggare entered it in, the changed one out. */
export type CalculationChange = (calculation: LifecareCalculationRaw, forEdit: LifecareCalculationForEditRaw) => LifecareCalculationRaw;

const toTypeOptions = (types: LifecareCalculationTypeRaw[]): NormTypeOption[] =>
  types.filter(type => type.isActive).map(type => ({ code: String(type.id), displayName: type.text }));

/** Lifecare's norms as the Norm list offers them — the code is the normId. */
export const toNormOptions = (norms: LifecareCalculationForEditRaw['norms']): NormTypeOption[] =>
  norms.map(norm => ({ code: String(norm.normId), displayName: norm.name }));

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

  /** Whether the saved beräkning has an own household size (Annan hushållsstorlek) — read from Lifecare, logged. */
  async readHasCustomHouseholdSize(errandId: string, calculationId: number): Promise<boolean> {
    const forEdit = await this.calculations.readForEdit(calculationId);
    await this.accessLog.logRead(errandId, {
      target: 'CALCULATION',
      description: 'Läste normberäkningen i Lifecare',
      lifecareId: String(calculationId),
    });
    return forEdit.calculation.hasCustomHouseholdSize;
  }

  /** Lifecare's own inkomst-, utgifts- and levnadskostnadstyper for the beräkning. */
  async readTypes(calculationId: number): Promise<NormberakningTypes> {
    const forEdit = await this.calculations.readForEdit(calculationId);
    return {
      norms: toNormOptions(forEdit.norms),
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
    // On a new norm Lifecare decides afresh which normintervall each member is on.
    const keepPlacements = changed.normId === forEdit.calculation.normId;
    const counted = await this.withCountedAmounts(forEdit.calculation, await this.calculations.placeAndMark(changed, jobStimulus, keepPlacements));
    const placed = await this.withSharedCost(forEdit.calculation, counted);
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
    // On a new norm every member was just placed afresh, with the amount Lifecare placed them with.
    if (before.normId !== calculation.normId) {
      return calculation;
    }
    const calculationPersons = await Promise.all(
      calculation.calculationPersons.map(async member => {
        const normRow = calculation.norm?.rows?.find(row => row.rowId === member.normRowId);
        return needsRecount(before, member) && normRow
          ? { ...member, amount: await this.calculations.amountFor(member, normRow, calculation.startDate, calculation.endDate) }
          : member;
      }),
    );
    return { ...calculation, calculationPersons };
  }

  /**
   * Has Lifecare count the gemensamma kostnader again when the household size or the members counted changed
   * (`Calculation/GetSharedCost`), and takes the members' share of them.
   */
  private async withSharedCost(before: LifecareCalculationRaw, calculation: LifecareCalculationRaw): Promise<LifecareCalculationRaw> {
    const shared = householdSizeChanged(before, calculation) ? sharedCostShare(calculation) : undefined;
    if (!shared) {
      return calculation;
    }
    const amountForHouseholdSize = await this.calculations.sharedCost(calculation.startDate, calculation.endDate, shared.normShared);
    return { ...calculation, amountForHouseholdSize, commonHouseholdCost: shared.share(amountForHouseholdSize) };
  }
}

export default LifecareCalculationEditService;
