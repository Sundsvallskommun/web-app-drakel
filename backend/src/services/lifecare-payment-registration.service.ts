import { HttpException } from '@exceptions/HttpException';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecarePaymentsService from '@services/lifecare-payments.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { isLifecareRefusal } from '@utils/lifecare-error';
import { buildPaymentCreate, findRegisteredPayment } from '@utils/lifecare-payment';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { PaymentInputDto } from '@/dtos/payment.dto';
import { LifecarePaymentCreated } from '@/responses/lifecare-payment-created.response';

/**
 * Registers the handläggare's utbetalning straight in Lifecare with `Payment/Create` — the register of
 * record. careM keeps no copy: what has been paid is read back from Lifecare.
 *
 * `Payment/Create` is not idempotent and moves money, so every step leans towards not paying:
 * - one the builder cannot vouch for (see buildPaymentCreate) is refused with the reason, and nothing is sent;
 * - one Lifecare already holds — same amount, month, account and date — is refused rather than made again,
 *   which is also what makes a retry after an unanswered call safe;
 * - a refusal Lifecare itself gave is passed on in Lifecare's words;
 * - a call Lifecare did not answer is reported as such, since whether it paid is then unknown.
 */
class LifecarePaymentRegistrationService {
  private lifecarePayments = new LifecarePaymentsService();
  private serviceIds = new LifecareServiceIdService();
  private accessLog = new LifecareAccessLogService();

  async register(errandId: string, input: PaymentInputDto): Promise<LifecarePaymentCreated> {
    const serviceId = await this.serviceIds.resolve(errandId);
    // A fresh underlag every time: the balance it carries changes with each utbetalning registered.
    const underlag = await this.lifecarePayments.readPaymentForCreate(serviceId);
    await this.accessLog.logRead(errandId, { target: 'PAYEES', description: 'Läste utbetalningsunderlag i Lifecare' });

    const create = buildPaymentCreate(underlag, input);
    if (!create.writable) {
      throw new HttpException(422, create.reason);
    }
    // Lifecare's web app checks the person has a hushåll on the payment date before it saves; so does this.
    const personId = underlag.payment.susPersonId;
    if (!personId || !(await this.lifecarePayments.hasHouseholdOn(personId, String(create.body.payDate)))) {
      throw new HttpException(422, 'Personen har inget hushåll i Lifecare på utbetalningsdagen.');
    }

    const alreadyRegistered = findRegisteredPayment(await this.lifecarePayments.readLatestPayments(serviceId), create.body);
    if (alreadyRegistered) {
      throw new HttpException(
        409,
        `En likadan utbetalning finns redan i Lifecare (id ${String(alreadyRegistered.paymentId)}): samma belopp, månad, konto och datum.`,
      );
    }

    let lifecareId: string;
    try {
      lifecareId = String((await this.lifecarePayments.createPayment(serviceId, create.body)).paymentId);
    } catch (error) {
      if (isLifecareRefusal(error)) {
        throw error;
      }
      throw new HttpException(
        502,
        'Lifecare svarade inte. Kontrollera utbetalningarna i Lifecare innan du försöker igen — en som ändå kom fram känns igen och skapas inte två gånger.',
      );
    }

    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
      target: 'PAYMENT',
      description: 'Registrerade en utbetalning i Lifecare',
      lifecareId,
    });
    return { lifecareId };
  }
}

export default LifecarePaymentRegistrationService;
