import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import CaremanagementPaymentService from '@services/caremanagement-payment.service';
import DecisionNotificationService from '@services/decision-notification.service';
import LifecareDecisionRegistrationService from '@services/lifecare-decision-registration.service';
import LifecarePaymentRegistrationService from '@services/lifecare-payment-registration.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { buildFinalizeRequest, draftPayments, latestSavedBeslut } from '@utils/finalize-request';
import { logger } from '@utils/logger';

import { CommunicationChannels, FinalizeDecision, FinalizeResponse, Payment } from '@/data-contracts/caremanagement/data-contracts';
import { FinalizeErrandDto } from '@/dtos/finalize.dto';
import { DecisionRegistration } from '@/responses/decision-registration.response';
import { FinalizeResult } from '@/responses/finalize.response';
import { PaymentRegistration } from '@/responses/payment-registration.response';

// The labels the beslut dialog uses for the channels, reported back when a channel could not be sent.
const ALL_CHANNEL_LABELS = { minaSidor: 'Mina sidor', digitalBrevlada: 'Digital brevlåda', brev: 'Brev' } as const;

const toCommunicationChannels = (input: FinalizeErrandDto): CommunicationChannels => ({
  minaSidor: !!input.minaSidor,
  digitalMailbox: !!input.digitalBrevlada,
  letter: !!input.brev,
});

const selectedChannelLabels = (input: FinalizeErrandDto): string[] =>
  (Object.keys(ALL_CHANNEL_LABELS) as (keyof typeof ALL_CHANNEL_LABELS)[])
    .filter(channel => input[channel])
    .map(channel => ALL_CHANNEL_LABELS[channel]);

/** The text, or undefined when there is nothing but whitespace in it. */
const nonBlank = (text: string | undefined): string | undefined => (text?.trim() ? text.trim() : undefined);

const toFinalizeResult = (
  finalized: FinalizeResponse | undefined,
  lifecareDecision: DecisionRegistration | undefined,
  lifecarePayments: PaymentRegistration[],
  failedChannels: string[],
): FinalizeResult => ({
  decisionId: finalized?.decisionId,
  paymentIds: finalized?.paymentIds ?? [],
  payeeWarnings: finalized?.payeeWarnings ?? [],
  failedRpaTasks: (finalized?.rpaTasks ?? []).filter(task => !task.enqueued).map(task => task.action ?? ''),
  processMessageCorrelated: finalized?.processMessageCorrelated ?? false,
  lifecareDecision,
  lifecarePayments,
  failedChannels,
});

/**
 * "Besluta och utbetala": finalizes the errand in caremanagement and then sends the beslut to the applicant.
 *
 * caremanagement records the PAYMENT decision, creates the payment rows and resumes the process (which sets
 * the errand GRANTED/REJECTED). The BFF then does what the robot was meant to: registers the beslut in
 * Lifecare, then the utbetalningar, one per payment row, receipting each back to careM. The order is
 * Lifecare's: an utbetalning draws on the balance the beslut gives the insats, so one whose beslut did not
 * get written waits as PENDING_REGISTRATION for a run from the Utbetalning tab. Last it sends the beslut
 * to the applicant through the chosen channels.
 *
 * Once caremanagement has accepted the finalize the errand is decided and cannot be finalized again, so every
 * step after it is best-effort and reported in the result rather than thrown.
 */
class ErrandFinalizeService {
  private decisionService = new CaremanagementDecisionService();
  private paymentService = new CaremanagementPaymentService();
  private normberakningService = new CaremanagementNormberakningService();
  private notificationService = new DecisionNotificationService();
  private decisionRegistration = new LifecareDecisionRegistrationService();
  private paymentRegistration = new LifecarePaymentRegistrationService();
  private serviceIds = new LifecareServiceIdService();

  async finalize(errandId: string, input: FinalizeErrandDto, author: string): Promise<FinalizeResult> {
    const [decisions, payments, householdSizeChanged, reason] = await Promise.all([
      this.decisionService.readDecisions(errandId),
      this.paymentService.listPayments(errandId),
      this.normberakningService.readHouseholdSizeChanged(errandId),
      this.resolveReason(errandId, input.reason),
    ]);
    const drafts = draftPayments(payments.data ?? []);
    const request = buildFinalizeRequest({
      beslut: latestSavedBeslut(decisions.data ?? []),
      drafts,
      reason,
      communication: toCommunicationChannels(input),
      householdSizeChanged,
    });

    const finalized = await this.decisionService.finalize(errandId, request);

    await this.removeDrafts(errandId, drafts);
    const serviceId = await this.resolveServiceId(errandId);
    const lifecareDecision = await this.registerDecision(errandId, serviceId, finalized.data.decisionId, request.decision, author);
    const lifecarePayments = await this.registerPayments(errandId, serviceId, finalized.data.paymentIds ?? []);
    const failedChannels = await this.sendBeslut(errandId, input, author);
    return toFinalizeResult(finalized.data, lifecareDecision, lifecarePayments, failedChannels);
  }

  /** The insats in Lifecare, or why it could not be looked up — which then holds back every Lifecare write. */
  private async resolveServiceId(errandId: string): Promise<number | string> {
    try {
      return await this.serviceIds.resolve(errandId);
    } catch (error) {
      return error instanceof Error ? error.message : 'Insatsen i Lifecare kunde inte slås upp.';
    }
  }

  /** Registers the finalized beslut in Lifecare. Nothing here may undo the finalize, so a failure is an outcome. */
  private async registerDecision(
    errandId: string,
    serviceId: number | string,
    decisionId: string | undefined,
    decision: FinalizeDecision,
    handlaggare: string,
  ): Promise<DecisionRegistration | undefined> {
    if (!decisionId) {
      return undefined;
    }
    if (typeof serviceId === 'string') {
      return { decisionId, outcome: 'NOT_SENT', detail: serviceId };
    }
    try {
      return await this.decisionRegistration.register(errandId, serviceId, decisionId, decision, handlaggare);
    } catch {
      logger.warn(`Finalized errand ${errandId} but could not register decision ${decisionId} in Lifecare`);
      return { decisionId, outcome: 'NOT_SENT', detail: 'Beslutet kunde inte registreras i Lifecare. Registrera det direkt i Lifecare.' };
    }
  }

  /**
   * Registers the new utbetalningar in Lifecare one at a time — each one draws on the balance the next
   * one reads. Nothing here may undo the finalize, so a failure becomes an outcome, never an exception.
   */
  private async registerPayments(errandId: string, serviceId: number | string, paymentIds: string[]): Promise<PaymentRegistration[]> {
    if (typeof serviceId === 'string') {
      return paymentIds.map(paymentId => ({ paymentId, outcome: 'NOT_SENT', detail: serviceId }));
    }

    const registrations: PaymentRegistration[] = [];
    for (const paymentId of paymentIds) {
      try {
        registrations.push(await this.paymentRegistration.register(errandId, serviceId, paymentId));
      } catch {
        logger.warn(`Finalized errand ${errandId} but could not register payment ${paymentId} in Lifecare`);
        registrations.push({ paymentId, outcome: 'NOT_SENT', detail: 'Utbetalningen kunde inte registreras i Lifecare. Försök igen.' });
      }
    }
    return registrations;
  }

  /** The orsak the handläggare picked, or — when they never touched it — the one the beslutsförslag proposes. */
  private async resolveReason(errandId: string, pickedReason: string | undefined): Promise<string | undefined> {
    if (pickedReason !== undefined) {
      return nonBlank(pickedReason);
    }
    try {
      const proposal = await this.decisionService.readDecisionProposal(errandId);
      return nonBlank(proposal.data?.reason);
    } catch {
      return undefined;
    }
  }

  /**
   * The drafts are now represented by the payment rows finalize created, so they go — left in place they
   * would be counted twice against the beslut. A draft that cannot be removed is logged, not raised.
   */
  private async removeDrafts(errandId: string, drafts: Payment[]): Promise<void> {
    await Promise.all(
      drafts.map(async draft => {
        if (!draft.id) {
          return;
        }
        try {
          await this.paymentService.deletePayment(errandId, draft.id);
        } catch {
          logger.warn(`Finalized errand ${errandId} but could not remove payment draft ${draft.id}`);
        }
      }),
    );
  }

  /** Sends the beslut, reporting every selected channel as failed when the send could not even start. */
  private async sendBeslut(errandId: string, input: FinalizeErrandDto, author: string): Promise<string[]> {
    try {
      return await this.notificationService.send(errandId, input, author);
    } catch {
      logger.warn(`Finalized errand ${errandId} but could not send the beslut`);
      return selectedChannelLabels(input);
    }
  }
}

export default ErrandFinalizeService;
