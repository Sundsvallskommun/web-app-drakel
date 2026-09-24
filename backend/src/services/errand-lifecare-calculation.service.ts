import { HttpException } from '@exceptions/HttpException';
import { LifecareCalculationRaw } from '@interfaces/lifecare-calculation.interface';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareCalculationEditService from '@services/lifecare-calculation-edit.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import LifecareJobStimulusService from '@services/lifecare-job-stimulus.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { applyDraft, buildCalculationCreate, CalculationDraftInput, householdSizeOf, withJobStimulusIncomes } from '@utils/lifecare-calculation';
import { isLifecareRefusal } from '@utils/lifecare-error';
import { logger } from '@utils/logger';
import { succeedsWithin } from '@utils/retry';
import { swedishToday } from '@utils/swedish-today';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareCalculationView, toLifecareCalculationView } from '@/responses/lifecare-calculation.response';

// careM calls that must not be lost to a single hiccup are tried this many times.
const CAREM_ATTEMPTS = 3;

/**
 * The errand's normberäkning, kept in Lifecare. careM's draft — filled from the ansökan and SSBTEK — is the
 * working copy until the first Spara creates the beräkning in Lifecare (`Calculation/Create`); careM then keeps
 * only the reference (`lifecareCalculationId`). After that Lifecare owns the beräkning: the tab changes it
 * there directly (see LifecareCalculationEditService), and Lifecare's own summering is the result shown.
 */
class ErrandLifecareCalculationService {
  private errandService = new CaremanagementErrandService();
  private normberakning = new CaremanagementNormberakningService();
  private calculations = new LifecareCalculationsService();
  private edit = new LifecareCalculationEditService();
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

  /** The errand's beräkning as Lifecare prints it; 404 while none is saved there. Reading it is logged. */
  async pdf(errandId: string): Promise<Buffer> {
    const calculationId = await this.calculationIdOf(errandId);
    if (calculationId === undefined) {
      throw new HttpException(404, 'Normberäkningen är inte sparad i Lifecare än.');
    }
    const pdf = await this.calculations.printCalculation(calculationId);
    await this.accessLog.logRead(errandId, {
      target: 'CALCULATION',
      description: 'Läste normberäkningen som PDF i Lifecare',
      lifecareId: String(calculationId),
    });
    return pdf;
  }

  /**
   * Saves the beräkning in Lifecare. The first time it is created from careM's draft — Lifecare places the
   * members on the norm, marks who has jobbstimulans and counts it — and the errand is pointed at it. Once it
   * exists Lifecare owns it and the draft is no longer used: saving again saves Lifecare's own beräkning,
   * which is what `finalize` (slutlig, after which Lifecare allows no change) needs.
   */
  async save(errandId: string, finalize = false): Promise<LifecareCalculationView> {
    const calculationId = await this.calculationIdOf(errandId);
    if (calculationId !== undefined) {
      return toLifecareCalculationView(await this.edit.change(errandId, calculationId, calculation => calculation, finalize));
    }

    const [serviceId, draft] = await Promise.all([this.serviceIds.resolve(errandId), this.normberakning.readDraft(errandId)]);
    const [proposal, jobStimulus] = await Promise.all([this.calculations.readProposal(serviceId), this.jobStimulus.readForService(serviceId)]);
    await this.accessLog.logRead(errandId, { target: 'CALCULATION', description: 'Läste beräkningsunderlag i Lifecare' });

    const draftInput: CalculationDraftInput = draft.data;
    const filled = applyDraft(proposal.calculation, proposal.calculation.calculationPersons, draftInput, proposal, swedishToday());
    if (!filled.writable) {
      throw new HttpException(422, filled.reason);
    }
    const calculation = withJobStimulusIncomes(await this.calculations.placeAndMark(filled.calculation, jobStimulus), proposal.incomeTypes);
    const household = householdSizeOf(calculation, draftInput);

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
    // Slutlig is a change to a saved beräkning, so the new one is saved again as slutlig.
    return toLifecareCalculationView(await this.edit.change(errandId, created.calculationId, saved => saved, true));
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
