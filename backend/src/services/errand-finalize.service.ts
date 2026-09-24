import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import CaremanagementPaymentService from '@services/caremanagement-payment.service';
import DecisionNotificationService from '@services/decision-notification.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import LifecarePaymentRegistrationService from '@services/lifecare-payment-registration.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { buildFinalizeRequest, draftPayments } from '@utils/finalize-request';
import { logger } from '@utils/logger';

import { CommunicationChannels, FinalizeResponse, Payment } from '@/data-contracts/caremanagement/data-contracts';
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

const toFinalizeResult = (
  finalized: FinalizeResponse | undefined,
  lifecareDecision: DecisionRegistration | undefined,
  lifecarePayments: PaymentRegistration[],
  failedChannels: string[],
): FinalizeResult => ({
  decisionId: finalized?.decisionId,
  paymentIds: finalized?.paymentIds ?? [],
  payeeWarnings: finalized?.payeeWarnings ?? [],
  processMessageCorrelated: finalized?.processMessageCorrelated ?? false,
  lifecareDecision,
  lifecarePayments,
  failedChannels,
});

/**
 * "Besluta och utbetala": finalizes the errand in caremanagement and then sends the beslut to the applicant.
 *
 * The beslut is already in Lifecare — the Beslut tab saves it there — so finalize reads it from Lifecare
 * and hands careM that. caremanagement records the PAYMENT decision, creates the payment rows and resumes
 * the process (which sets the errand GRANTED/REJECTED). The BFF then links careM's decision to the Lifecare
 * beslut and registers the utbetalningar in Lifecare, one per payment row, receipting each back to careM.
 * Last it sends Lifecare's print of the beslut to the applicant through the chosen channels.
 *
 * Once caremanagement has accepted the finalize the errand is decided and cannot be finalized again, so every
 * step after it is best-effort and reported in the result rather than thrown.
 */
class ErrandFinalizeService {
  private decisionService = new CaremanagementDecisionService();
  private paymentService = new CaremanagementPaymentService();
  private normberakningService = new CaremanagementNormberakningService();
  private notificationService = new DecisionNotificationService();
  private lifecareDecision = new ErrandLifecareDecisionService();
  private paymentRegistration = new LifecarePaymentRegistrationService();
  private serviceIds = new LifecareServiceIdService();

  async finalize(errandId: string, input: FinalizeErrandDto, author: string): Promise<FinalizeResult> {
    const [beslut, payments, householdSizeChanged] = await Promise.all([
      this.lifecareDecision.read(errandId),
      this.paymentService.listPayments(errandId),
      this.normberakningService.readHouseholdSizeChanged(errandId),
    ]);
    const drafts = draftPayments(payments.data ?? []);
    const request = buildFinalizeRequest({
      beslut,
      drafts,
      communication: toCommunicationChannels(input),
      householdSizeChanged,
    });

    const finalized = await this.decisionService.finalize(errandId, request);

    await this.removeDrafts(errandId, drafts);
    const serviceId = await this.resolveServiceId(errandId);
    const lifecareDecision =
      finalized.data.decisionId && beslut ? await this.lifecareDecision.receiptFinalized(errandId, finalized.data.decisionId, beslut.id) : undefined;
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
