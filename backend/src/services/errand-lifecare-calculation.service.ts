import { HttpException } from '@exceptions/HttpException';
import { LifecareCalculationRaw } from '@interfaces/lifecare-calculation.interface';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import LifecareJobStimulusService from '@services/lifecare-job-stimulus.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import {
  applyDraft,
  buildCalculationCreate,
  buildCalculationUpdate,
  CalculationDraftInput,
  householdSizeOf,
  withJobStimulusIncomes,
  withPlacedPersons,
} from '@utils/lifecare-calculation';
import { isLifecareRefusal } from '@utils/lifecare-error';
import { logger } from '@utils/logger';
import { succeedsWithin } from '@utils/retry';
import { swedishToday } from '@utils/swedish-today';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareCalculationView, toLifecareCalculationView } from '@/responses/lifecare-calculation.response';

// careM calls that must not be lost to a single hiccup are tried this many times.
const CAREM_ATTEMPTS = 3;

/**
 * The errand's normberäkning, kept in Lifecare. careM's draft is the handläggare's working copy; Spara sends
 * it to Lifecare — `Calculation/Create` the first time, `Calculation/Update` after that — and careM keeps only
 * the reference (`lifecareCalculationId`), so the same beräkning is changed again rather than a second one
 * made. From then on Lifecare's own summering is the result the tabs show.
 */
class ErrandLifecareCalculationService {
  private errandService = new CaremanagementErrandService();
  private normberakning = new CaremanagementNormberakningService();
  private calculations = new LifecareCalculationsService();
  private jobStimulus = new LifecareJobStimulusService();
  private serviceIds = new LifecareServiceIdService();
  private accessLog = new LifecareAccessLogService();

  /** The errand's beräkning as it stands in Lifecare, or undefined while none has been saved. */
  async read(errandId: string): Promise<LifecareCalculationView | undefined> {
    const calculationId = await this.calculationIdOf(errandId);
    if (calculationId === undefined) {
      return undefined;
    }
    const saved = await this.calculations.readForEdit(calculationId);
    await this.accessLog.logRead(errandId, {
      target: 'CALCULATION',
      description: 'Läste normberäkningen i Lifecare',
      lifecareId: String(calculationId),
    });
    return toLifecareCalculationView(saved.calculation);
  }

  /**
   * Saves the draft in Lifecare: Lifecare places the members on the norm, marks who has jobbstimulans, and
   * counts the beräkning. Created the first time and the errand pointed at it, changed every time after.
   * `finalize` saves it as slutlig; Lifecare then allows no change, so a new beräkning is created first when
   * none exists.
   */
  async save(errandId: string, finalize = false): Promise<LifecareCalculationView> {
    const [serviceId, calculationId, draft] = await Promise.all([
      this.serviceIds.resolve(errandId),
      this.calculationIdOf(errandId),
      this.normberakning.readDraft(errandId),
    ]);
    const [proposal, saved, jobStimulus] = await Promise.all([
      this.calculations.readProposal(serviceId),
      calculationId === undefined ? Promise.resolve(undefined) : this.calculations.readForEdit(calculationId),
      this.jobStimulus.readForService(serviceId),
    ]);
    await this.accessLog.logRead(errandId, { target: 'CALCULATION', description: 'Läste beräkningsunderlag i Lifecare' });
    if (saved?.calculation.isFinalized) {
      throw new HttpException(422, 'Normberäkningen är sparad som slutlig i Lifecare och kan inte ändras.');
    }

    const draftInput: CalculationDraftInput = draft.data;
    const base = saved?.calculation ?? proposal.calculation;
    const filled = applyDraft(base, proposal.calculation.calculationPersons, draftInput, saved ?? proposal, swedishToday());
    if (!filled.writable) {
      throw new HttpException(422, filled.reason);
    }
    const catalogues = saved ?? proposal;
    const calculation = withJobStimulusIncomes(await this.placeAndMark(filled.calculation, jobStimulus), catalogues.incomeTypes);
    const household = householdSizeOf(calculation, draftInput);

    if (calculationId !== undefined) {
      return this.updateInLifecare(errandId, calculationId, buildCalculationUpdate(calculation, household, finalize), finalize);
    }

    const created = await this.createInLifecare(serviceId, buildCalculationCreate(calculation, household));
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
      target: 'CALCULATION',
      description: 'Sparade normberäkningen i Lifecare',
      lifecareId: String(created.calculationId),
    });
    await this.link(errandId, created.calculationId);
    if (!finalize) {
      return toLifecareCalculationView(created);
    }
    // Slutlig is a change to a saved beräkning, so the new one is read back in the shape Update takes.
    const createdForEdit = await this.calculations.readForEdit(created.calculationId);
    return this.updateInLifecare(errandId, created.calculationId, buildCalculationUpdate(createdForEdit.calculation, household, true), true);
  }

  private async updateInLifecare(
    errandId: string,
    calculationId: number,
    body: Record<string, unknown>,
    finalize: boolean,
  ): Promise<LifecareCalculationView> {
    const updated = await this.calculations.update(calculationId, body);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.UPDATE, {
      target: 'CALCULATION',
      description: finalize ? 'Sparade normberäkningen som slutlig i Lifecare' : 'Ändrade normberäkningen i Lifecare',
      lifecareId: String(calculationId),
    });
    return toLifecareCalculationView(updated);
  }

  /** Has Lifecare place the included members on the norm and mark who has jobbstimulans in the period. */
  private async placeAndMark(
    calculation: LifecareCalculationRaw,
    jobStimulus: Awaited<ReturnType<LifecareJobStimulusService['readForService']>>,
  ): Promise<LifecareCalculationRaw> {
    const placed = await this.calculations.placePersons({
      startDate: calculation.startDate,
      endDate: calculation.endDate,
      normId: calculation.normId,
      calculationPersons: calculation.calculationPersons.filter(person => person.included),
    });
    const withNorm = withPlacedPersons(calculation, placed.calculationPersons);
    const marked = await this.calculations.withJobStimuli(withNorm, jobStimulus);
    return { ...withNorm, hasApplicantJobStimuli: marked.hasApplicantJobStimuli, hasCoApplicantJobStimuli: marked.hasCoApplicantJobStimuli };
  }

  /** Creates the beräkning, telling a call Lifecare never answered apart from a refusal. */
  private async createInLifecare(serviceId: number, body: Record<string, unknown>): Promise<LifecareCalculationRaw> {
    try {
      return await this.calculations.create(serviceId, body);
    } catch (error) {
      if (isLifecareRefusal(error)) {
        throw error;
      }
      throw new HttpException(502, 'Lifecare svarade inte när normberäkningen sparades. Kontrollera i Lifecare om den finns innan du sparar igen.');
    }
  }

  /** Points the errand at the new beräkning. Without the link the next Spara would make a second one. */
  private async link(errandId: string, calculationId: number): Promise<void> {
    const linked = await succeedsWithin(CAREM_ATTEMPTS, () => this.errandService.setLifecareCalculationId(errandId, calculationId));
    if (!linked) {
      logger.error(`Beräkning ${String(calculationId)} was created in Lifecare but errand ${errandId} could not be pointed at it`);
      throw new HttpException(
        502,
        `Normberäkningen sparades i Lifecare (beräkning ${String(calculationId)}) men kunde inte kopplas till ärendet. Spara inte igen – då skapas en beräkning till.`,
      );
    }
  }

  private async calculationIdOf(errandId: string): Promise<number | undefined> {
    const view = await this.errandService.getFinancialAssistanceView(errandId);
    return view.data?.data?.lifecareCalculationId ?? undefined;
  }
}

export default ErrandLifecareCalculationService;
