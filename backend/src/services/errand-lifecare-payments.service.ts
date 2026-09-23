import { HttpException } from '@exceptions/HttpException';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecarePaymentsService from '@services/lifecare-payments.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { buildPayeeCreate, findMatchingPayee, NewLifecarePayee } from '@utils/lifecare-payee';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { LifecarePayeeView, LifecarePaymentOptionsView, toPayeeView, toPaymentOptions } from '@/responses/lifecare-payment-options.response';

/**
 * The betalsätt and betalningsmottagare of an errand's insats, read and written in Lifecare — the
 * register of record for both. Nothing is kept in careM; careM only gets the access-log rows.
 */
class ErrandLifecarePaymentsService {
  private paymentsService = new LifecarePaymentsService();
  private serviceIds = new LifecareServiceIdService();
  private accessLog = new LifecareAccessLogService();

  /** The betalsätt in use on the insats and the person's active payees. */
  async paymentOptions(errandId: string): Promise<LifecarePaymentOptionsView> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const raw = await this.paymentsService.readPaymentForCreate(serviceId);
    await this.accessLog.logRead(errandId, { target: 'PAYEES', description: 'Läste betalningsmottagare i Lifecare' });
    return toPaymentOptions(raw);
  }

  /**
   * Adds a betalningsmottagare in Lifecare, for the person the insats belongs to.
   *
   * `Payee/Create` is not idempotent, so a payee already paying to the same account with the same
   * betalsätt is returned instead of being created a second time. The personnummer the payee is filed
   * under is taken from Lifecare's own underlag for the insats, so careM never has to hand it out.
   */
  async createPayee(errandId: string, payee: NewLifecarePayee): Promise<LifecarePayeeView> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const raw = await this.paymentsService.readPaymentForCreate(serviceId);
    await this.accessLog.logRead(errandId, { target: 'PAYEES', description: 'Läste betalningsmottagare i Lifecare' });

    if (!raw.paymentMethods.some(method => method.paymentCode === payee.paymentMethod && method.inUse)) {
      throw new HttpException(400, 'Betalsättet finns inte på insatsen i Lifecare');
    }
    const existing = findMatchingPayee(raw.payees, payee);
    if (existing) {
      return toPayeeView(existing, raw.paymentMethods);
    }
    const personId = raw.payment.susPersonId;
    if (!personId) {
      throw new HttpException(502, 'Lifecare angav ingen person för insatsen');
    }

    const created = await this.paymentsService.createPayee(buildPayeeCreate(personId, payee));
    await this.accessLog.logWrite(errandId, LifecareAccessActionEnum.CREATE, {
      target: 'PAYEE',
      description: 'Lade till en betalningsmottagare i Lifecare',
      lifecareId: String(created.payeeId),
    });
    return toPayeeView(created, raw.paymentMethods);
  }
}

export default ErrandLifecarePaymentsService;
