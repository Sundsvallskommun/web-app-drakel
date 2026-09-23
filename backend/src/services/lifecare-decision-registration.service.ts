import { LIFECARE_TEST_DECISION_MAKER } from '@config';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecareDecisionsService from '@services/lifecare-decisions.service';
import { buildDecisionCreate, decisionCodeFor, findReasonCode } from '@utils/lifecare-decision';
import { isLifecareRefusal } from '@utils/lifecare-error';
import { logger } from '@utils/logger';
import { succeedsWithin } from '@utils/retry';

import { DecisionLifecareResultOutcomeEnum, FinalizeDecision, LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { DecisionRegistration } from '@/responses/decision-registration.response';

// careM's answer to a lifecare-result is retried this many times: once Lifecare holds the beslut, a lost
// receipt leaves careM thinking it was never written.
const RECEIPT_ATTEMPTS = 3;

/**
 * Registers the beslut just made in "Besluta och utbetala" in Lifecare — the work the WRITE_DECISION robot
 * was meant to do — and hands the outcome back to careM with `decisions/{id}/lifecare-result`.
 *
 * The beslut is the one the handläggare decided now, as it went to finalize; everything it is checked
 * against — beslutstyper, orsaker, beslutsfattare and who the beslut concerns — is Lifecare's own. Nothing
 * older is read from careM or Drakel.
 *
 * `Decision/Create` is not idempotent and accepts a wrong beslut without complaint, so every step leans
 * towards not writing: a beslut the builder cannot vouch for (see buildDecisionCreate) or whose orsak
 * Lifecare does not know is not sent; only a refusal Lifecare itself gave is reported as FAILED; and a
 * call Lifecare did not answer is not reported at all, since whether it wrote the beslut is then unknown.
 */
class LifecareDecisionRegistrationService {
  private caremanagementDecisions = new CaremanagementDecisionService();
  private lifecareDecisions = new LifecareDecisionsService();
  private accessLog = new LifecareAccessLogService();

  /**
   * @param decisionId careM's id for the finalized beslut — what the outcome is receipted against.
   * @param decision The beslut as it was sent to finalize.
   * @param handlaggare The signed-in handläggare's account — the beslutsfattare, unless a test
   * environment configures its own (LIFECARE_TEST_DECISION_MAKER).
   */
  async register(
    errandId: string,
    serviceId: number,
    decisionId: string,
    decision: FinalizeDecision,
    handlaggare: string,
  ): Promise<DecisionRegistration> {
    const notSent = (detail: string): DecisionRegistration => ({ decisionId, outcome: 'NOT_SENT', detail });

    const code = decisionCodeFor(decision.outcome);
    const [proposal, reasonCode] = await Promise.all([
      this.lifecareDecisions.readProposal(serviceId),
      code === undefined ? Promise.resolve(undefined) : this.reasonCodeFor(code, decision.reason),
    ]);
    await this.accessLog.logRead(errandId, { target: 'DECISION', description: 'Läste beslutsunderlag i Lifecare' });
    if (code !== undefined && reasonCode === undefined) {
      return notSent(`Orsaken "${decision.reason ?? ''}" finns inte i Lifecare för beslutstypen.`);
    }

    const create = buildDecisionCreate(proposal, {
      outcome: decision.outcome,
      periodFrom: decision.periodFrom,
      periodTo: decision.periodTo,
      amount: decision.amount,
      reasonCode: reasonCode ?? 0,
      message: decision.decisionMessage,
      decisionMakerId: LIFECARE_TEST_DECISION_MAKER || handlaggare,
    });
    if (!create.writable) {
      return notSent(create.reason);
    }

    let lifecareId: string;
    try {
      lifecareId = String((await this.lifecareDecisions.create(serviceId, create.body)).decisionId);
    } catch (error) {
      if (isLifecareRefusal(error)) {
        await this.receipt(errandId, decisionId, { outcome: DecisionLifecareResultOutcomeEnum.FAILED, detail: error.message });
        return { decisionId, outcome: 'FAILED', detail: error.message };
      }
      return notSent('Lifecare svarade inte. Kontrollera i Lifecare om beslutet finns där innan det registreras för hand.');
    }

    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
      target: 'DECISION',
      description: 'Registrerade ett beslut i Lifecare',
      lifecareId,
    });
    const receipted = await this.receipt(errandId, decisionId, { outcome: DecisionLifecareResultOutcomeEnum.WRITTEN, lifecareId });
    return receipted
      ? { decisionId, outcome: 'REGISTERED', lifecareId }
      : {
          decisionId,
          outcome: 'REGISTERED',
          lifecareId,
          detail: `Registrerat i Lifecare (beslut ${lifecareId}) men kunde inte kvitteras i careM.`,
        };
  }

  /** The Lifecare code of the orsak the handläggare picked, from Lifecare's catalogue for the beslutstyp. */
  private async reasonCodeFor(decisionCode: number, reason: string | undefined): Promise<number | undefined> {
    if (!reason) {
      return undefined;
    }
    return findReasonCode(await this.lifecareDecisions.readReasons(decisionCode), reason);
  }

  /** Reports to careM, retrying a few times; resolves false when careM never took the receipt. */
  private async receipt(
    errandId: string,
    decisionId: string,
    result: { outcome: DecisionLifecareResultOutcomeEnum; lifecareId?: string; detail?: string },
  ): Promise<boolean> {
    const receipted = await succeedsWithin(
      RECEIPT_ATTEMPTS,
      () => this.caremanagementDecisions.reportLifecareResult(errandId, decisionId, result),
      attempt => {
        logger.warn(`Could not report the Lifecare result for decision ${decisionId} on errand ${errandId} (attempt ${String(attempt)})`);
      },
    );
    if (!receipted) {
      logger.error(`Decision ${decisionId} on errand ${errandId} has Lifecare outcome ${result.outcome} that careM never received`);
    }
    return receipted;
  }
}

export default LifecareDecisionRegistrationService;
