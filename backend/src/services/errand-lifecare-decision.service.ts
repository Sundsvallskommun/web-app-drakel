import { LIFECARE_TEST_DECISION_MAKER } from '@config';
import { HttpException } from '@exceptions/HttpException';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareDecisionsService from '@services/lifecare-decisions.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { buildDecisionCreate, buildDecisionUpdate, LifecareDecisionInput } from '@utils/lifecare-decision';
import { isLifecareRefusal } from '@utils/lifecare-error';
import { logger } from '@utils/logger';
import { succeedsWithin } from '@utils/retry';

import { DecisionLifecareResultOutcomeEnum, LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { SaveLifecareDecisionDto } from '@/dtos/lifecare-decision.dto';
import { DecisionRegistration } from '@/responses/decision-registration.response';
import {
  LifecareDecisionReasonView,
  LifecareDecisionTypeView,
  LifecareDecisionView,
  toDecisionReasons,
  toDecisionTypes,
  toLifecareDecisionView,
} from '@/responses/lifecare-decision.response';

// Calls to careM that must not be lost to a single hiccup are tried this many times.
const CAREM_ATTEMPTS = 3;

/**
 * The errand's beslut, kept in Lifecare. The handläggare's Spara writes it there — `Decision/Create` the
 * first time, `Decision/Update` after that — and careM keeps only the reference (`lifecareDecisionId`),
 * so the same beslut is found and changed again rather than a second one made. Previews and what goes
 * to the sökande are Lifecare's own print of it.
 *
 * Lifecare accepts a wrong beslut without complaint, so every write goes through the checks in
 * buildDecisionCreate/buildDecisionUpdate, and a refusal is handed back in words the handläggare can act on.
 */
class ErrandLifecareDecisionService {
  private errandService = new CaremanagementErrandService();
  private caremanagementDecisions = new CaremanagementDecisionService();
  private lifecareDecisions = new LifecareDecisionsService();
  private serviceIds = new LifecareServiceIdService();
  private accessLog = new LifecareAccessLogService();

  /** The errand's beslut as it stands in Lifecare, or undefined while none has been saved. */
  async read(errandId: string): Promise<LifecareDecisionView | undefined> {
    const decisionId = await this.decisionIdOf(errandId);
    if (decisionId === undefined) {
      return undefined;
    }
    const saved = await this.lifecareDecisions.readDecision(decisionId);
    await this.accessLog.logRead(errandId, { target: 'DECISION', description: 'Läste beslutet i Lifecare', lifecareId: String(decisionId) });
    return toLifecareDecisionView(saved);
  }

  /** The beslutstyper the errand's insats offers — Lifecare's own list, read from its underlag. */
  async types(errandId: string): Promise<LifecareDecisionTypeView[]> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const proposal = await this.lifecareDecisions.readProposal(serviceId);
    await this.accessLog.logRead(errandId, { target: 'DECISION', description: 'Läste beslutstyper i Lifecare' });
    return toDecisionTypes(proposal.decisionTypes);
  }

  /** The orsaker a beslut of the type can carry — Lifecare's catalogue, which belongs to the type, not a person. */
  async reasons(decisionCode: number): Promise<LifecareDecisionReasonView[]> {
    if (!Number.isInteger(decisionCode)) {
      throw new HttpException(400, 'The beslutstyp code must be a whole number');
    }
    return toDecisionReasons(await this.lifecareDecisions.readReasons(decisionCode));
  }

  /**
   * Saves the beslut in Lifecare: creates it the first time and points the errand at it, changes the
   * same beslut every time after. The beslutsfattare is the handläggare saving it. Beslutstyp and orsak
   * are Lifecare's own codes; an orsak the type does not have is Lifecare's to refuse.
   */
  async save(errandId: string, input: SaveLifecareDecisionDto, handlaggare: string): Promise<LifecareDecisionView> {
    const [serviceId, decisionId] = await Promise.all([this.serviceIds.resolve(errandId), this.decisionIdOf(errandId)]);
    const [proposal, saved] = await Promise.all([
      this.lifecareDecisions.readProposal(serviceId),
      decisionId === undefined ? Promise.resolve(undefined) : this.lifecareDecisions.readDecision(decisionId),
    ]);
    await this.accessLog.logRead(errandId, { target: 'DECISION', description: 'Läste beslutsunderlag i Lifecare' });

    const decisionInput: LifecareDecisionInput = {
      decisionCode: input.decisionCode,
      date: input.date,
      periodFrom: input.periodFrom,
      periodTo: input.periodTo,
      amount: input.amount,
      reasonCode: input.reasonCode,
      message: input.decisionMessage,
      writeProtect: input.writeProtect === true,
      decisionMakerId: LIFECARE_TEST_DECISION_MAKER || handlaggare,
    };
    const built = saved ? buildDecisionUpdate(saved, proposal, decisionInput) : buildDecisionCreate(proposal, decisionInput);
    if (!built.writable) {
      throw new HttpException(422, built.reason);
    }

    if (saved) {
      const updated = await this.lifecareDecisions.update(saved.decisionId, built.body);
      await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.UPDATE, {
        target: 'DECISION',
        description: input.writeProtect ? 'Ändrade och skrivskyddade beslutet i Lifecare' : 'Ändrade beslutet i Lifecare',
        lifecareId: String(saved.decisionId),
      });
      return toLifecareDecisionView(updated);
    }

    const created = await this.createInLifecare(serviceId, built.body);
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
      target: 'DECISION',
      description: input.writeProtect ? 'Registrerade och skrivskyddade beslutet i Lifecare' : 'Registrerade beslutet i Lifecare',
      lifecareId: String(created),
    });
    await this.link(errandId, created);
    return toLifecareDecisionView(await this.lifecareDecisions.readDecision(created));
  }

  /** The errand's beslut as Lifecare prints it — for the preview and for what is sent to the sökande. */
  async pdf(errandId: string): Promise<Buffer> {
    const decisionId = await this.decisionIdOf(errandId);
    if (decisionId === undefined) {
      throw new HttpException(404, 'Beslutet är inte sparat i Lifecare ännu.');
    }
    const pdf = await this.lifecareDecisions.printDecision(decisionId);
    await this.accessLog.logRead(errandId, {
      target: 'DECISION',
      description: 'Hämtade beslutet som PDF från Lifecare',
      lifecareId: String(decisionId),
    });
    return pdf;
  }

  /**
   * Tells careM that the beslut its finalize recorded is this Lifecare beslut. The beslut is already in
   * Lifecare, so this only links the two; a receipt careM never takes is reported, never thrown.
   */
  async receiptFinalized(errandId: string, finalizedDecisionId: string, lifecareDecisionId: number): Promise<DecisionRegistration> {
    const lifecareId = String(lifecareDecisionId);
    const receipted = await succeedsWithin(
      CAREM_ATTEMPTS,
      () =>
        this.caremanagementDecisions.reportLifecareResult(errandId, finalizedDecisionId, {
          outcome: DecisionLifecareResultOutcomeEnum.WRITTEN,
          lifecareId,
        }),
      attempt => {
        logger.warn(`Could not link decision ${finalizedDecisionId} on errand ${errandId} to its Lifecare beslut (attempt ${String(attempt)})`);
      },
    );
    return receipted
      ? { decisionId: finalizedDecisionId, outcome: 'REGISTERED', lifecareId }
      : {
          decisionId: finalizedDecisionId,
          outcome: 'REGISTERED',
          lifecareId,
          detail: `Beslutet finns i Lifecare (beslut ${lifecareId}) men kunde inte kvitteras i careM.`,
        };
  }

  /**
   * Creates the beslut. A call Lifecare did not answer may still have written it, and saving again would
   * then make a second one, so that case is told apart from a plain refusal.
   */
  private async createInLifecare(serviceId: number, body: Record<string, unknown>): Promise<number> {
    try {
      return (await this.lifecareDecisions.create(serviceId, body)).decisionId;
    } catch (error) {
      if (isLifecareRefusal(error)) {
        throw error;
      }
      throw new HttpException(502, 'Lifecare svarade inte när beslutet sparades. Kontrollera i Lifecare om beslutet finns innan du sparar igen.');
    }
  }

  /** Points the errand at the new beslut. Without the link the next Spara would make a second beslut. */
  private async link(errandId: string, lifecareDecisionId: number): Promise<void> {
    const linked = await succeedsWithin(CAREM_ATTEMPTS, () => this.errandService.setLifecareDecisionId(errandId, lifecareDecisionId));
    if (!linked) {
      logger.error(`Beslut ${String(lifecareDecisionId)} was created in Lifecare but errand ${errandId} could not be pointed at it`);
      throw new HttpException(
        502,
        `Beslutet sparades i Lifecare (beslut ${String(lifecareDecisionId)}) men kunde inte kopplas till ärendet. Spara inte igen – då skapas ett beslut till.`,
      );
    }
  }

  private async decisionIdOf(errandId: string): Promise<number | undefined> {
    const view = await this.errandService.getFinancialAssistanceView(errandId);
    return view.data?.data?.lifecareDecisionId ?? undefined;
  }
}

export default ErrandLifecareDecisionService;
