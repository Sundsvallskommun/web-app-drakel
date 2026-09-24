import { HttpException } from '@exceptions/HttpException';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecarePaymentsService from '@services/lifecare-payments.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { isLifecareRefusal } from '@utils/lifecare-error';
import { buildPaymentCreate, findRegisteredPayment } from '@utils/lifecare-payment';
import { logger } from '@utils/logger';
import { succeedsWithin } from '@utils/retry';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { PaymentInputDto } from '@/dtos/payment.dto';
import { LifecarePaymentCreated } from '@/responses/lifecare-payment-created.response';

// careM calls that should not be lost to a single hiccup are tried this many times.
const CAREM_ATTEMPTS = 3;

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
 * Once made, the utbetalning's Lifecare id is added to the errand in careM (`lifecarePaymentIds`), so careM
 * finds a bifall's utbetalning by id; careM falls back on the insats and month when that did not reach it.
 */
class LifecarePaymentRegistrationService {
  private lifecarePayments = new LifecarePaymentsService();
  private serviceIds = new LifecareServiceIdService();
  private accessLog = new LifecareAccessLogService();
  private errandService = new CaremanagementErrandService();

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
    await this.linkToErrand(errandId, lifecareId);
    return { lifecareId };
  }

  /**
   * Tells careM the errand has the utbetalning. It is paid already, so a link that does not get through is
   * logged rather than raised — careM still finds the utbetalning by the insats and month.
   */
  private async linkToErrand(errandId: string, lifecareId: string): Promise<void> {
    const linked = await succeedsWithin(CAREM_ATTEMPTS, () => this.errandService.addLifecarePaymentId(errandId, lifecareId));
    if (!linked) {
      logger.error(`Utbetalning ${lifecareId} was registered in Lifecare but errand ${errandId} could not be pointed at it`);
    }
  }
}

export default LifecarePaymentRegistrationService;
