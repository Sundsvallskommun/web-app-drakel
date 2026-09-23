import CaremanagementPaymentService from '@services/caremanagement-payment.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecarePaymentsService from '@services/lifecare-payments.service';
import { isLifecareRefusal } from '@utils/lifecare-error';
import { buildPaymentCreate, findRegisteredPayment } from '@utils/lifecare-payment';
import { logger } from '@utils/logger';
import { succeedsWithin } from '@utils/retry';

import { LifecareAccessActionEnum, PaymentLifecareResultOutcomeEnum, PaymentStatusEnum } from '@/data-contracts/caremanagement/data-contracts';
import { PaymentRegistration } from '@/responses/payment-registration.response';

// careM's answer to a lifecare-result is retried this many times: once Lifecare holds the utbetalning,
// a lost receipt leaves careM thinking it was never registered — and a retry from there pays twice.
const RECEIPT_ATTEMPTS = 3;

/**
 * Registers careM's utbetalningar in Lifecare — the work the REGISTER_PAYMENT robot was meant to do —
 * and hands the outcome back to careM with `payments/{id}/lifecare-result`.
 *
 * Lifecare's `Payment/Create` is not idempotent and moves money, so every step leans towards not paying:
 * - an utbetalning careM already has as REGISTERED is left alone, and one Lifecare already holds is
 *   receipted as ALREADY_EXISTS instead of being made again;
 * - one the builder cannot vouch for (see buildPaymentCreate) is not sent, stays PENDING_REGISTRATION and
 *   can be run again once the reason is fixed — typically once the beslut is in Lifecare;
 * - only a refusal Lifecare itself gave is reported as FAILED, with Lifecare's reason;
 * - a call Lifecare did not answer is not reported at all, since whether it paid is then unknown; the next
 *   attempt finds out, through the duplicate check above.
 */
class LifecarePaymentRegistrationService {
  private caremanagementPayments = new CaremanagementPaymentService();
  private lifecarePayments = new LifecarePaymentsService();
  private accessLog = new LifecareAccessLogService();

  async register(errandId: string, serviceId: number, paymentId: string): Promise<PaymentRegistration> {
    const payment = (await this.caremanagementPayments.readPayment(errandId, paymentId)).data;
    if (payment.status === PaymentStatusEnum.REGISTERED || payment.lifecareId) {
      return { paymentId, outcome: 'REGISTERED', lifecareId: payment.lifecareId };
    }

    // A fresh underlag for every utbetalning: the balance it carries changes with each one registered.
    const underlag = await this.lifecarePayments.readPaymentForCreate(serviceId);
    await this.accessLog.logRead(errandId, { target: 'PAYEES', description: 'Läste utbetalningsunderlag i Lifecare' });

    const create = buildPaymentCreate(underlag, payment);
    if (!create.writable) {
      return { paymentId, outcome: 'NOT_SENT', detail: create.reason };
    }
    // Lifecare's web app checks the person has a hushåll on the payment date before it saves; so does this.
    const personId = underlag.payment.susPersonId;
    if (!personId || !(await this.lifecarePayments.hasHouseholdOn(personId, String(create.body.payDate)))) {
      return { paymentId, outcome: 'NOT_SENT', detail: 'Personen har inget hushåll i Lifecare på utbetalningsdagen.' };
    }

    // An utbetalning Lifecare already made — typically one whose receipt never reached careM — is
    // receipted as it stands rather than paid a second time.
    const alreadyRegistered = findRegisteredPayment(await this.lifecarePayments.readLatestPayments(serviceId), create.body);
    if (alreadyRegistered) {
      const existingId = String(alreadyRegistered.paymentId);
      await this.receipt(errandId, paymentId, { outcome: PaymentLifecareResultOutcomeEnum.ALREADY_EXISTS, lifecarePaymentId: existingId });
      return { paymentId, outcome: 'REGISTERED', lifecareId: existingId };
    }

    let lifecareId: string;
    try {
      lifecareId = String((await this.lifecarePayments.createPayment(serviceId, create.body)).paymentId);
    } catch (error) {
      if (isLifecareRefusal(error)) {
        await this.receipt(errandId, paymentId, { outcome: PaymentLifecareResultOutcomeEnum.FAILED, detail: error.message });
        return { paymentId, outcome: 'FAILED', detail: error.message };
      }
      return {
        paymentId,
        outcome: 'NOT_SENT',
        detail: 'Lifecare svarade inte. Försök igen — en utbetalning som ändå kom fram känns igen och skapas inte två gånger.',
      };
    }

    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
      target: 'PAYMENT',
      description: 'Registrerade en utbetalning i Lifecare',
      lifecareId,
    });
    const receipted = await this.receipt(errandId, paymentId, {
      outcome: PaymentLifecareResultOutcomeEnum.REGISTERED,
      lifecarePaymentId: lifecareId,
    });
    return receipted
      ? { paymentId, outcome: 'REGISTERED', lifecareId }
      : {
          paymentId,
          outcome: 'REGISTERED',
          lifecareId,
          detail: `Registrerad i Lifecare (id ${lifecareId}) men kunde inte kvitteras i careM. Kör "Registrera i Lifecare" igen för att kvittera den.`,
        };
  }

  /** Reports to careM, retrying a few times; resolves false when careM never took the receipt. */
  private async receipt(
    errandId: string,
    paymentId: string,
    result: { outcome: PaymentLifecareResultOutcomeEnum; lifecarePaymentId?: string; detail?: string },
  ): Promise<boolean> {
    const receipted = await succeedsWithin(
      RECEIPT_ATTEMPTS,
      () => this.caremanagementPayments.reportLifecareResult(errandId, paymentId, result),
      attempt => {
        logger.warn(`Could not report the Lifecare result for payment ${paymentId} on errand ${errandId} (attempt ${String(attempt)})`);
      },
    );
    if (receipted) {
      return true;
    }
    logger.error(`Payment ${paymentId} on errand ${errandId} has Lifecare outcome ${result.outcome} that careM never received`);
    return false;
  }
}

export default LifecarePaymentRegistrationService;
