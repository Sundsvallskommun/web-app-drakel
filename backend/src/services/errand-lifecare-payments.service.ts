import { HttpException } from '@exceptions/HttpException';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import LifecareAccessLogService from '@services/lifecare-access-log.service';
import LifecarePaymentsService from '@services/lifecare-payments.service';
import LifecareServiceIdService from '@services/lifecare-service-id.service';
import { buildPayeeCreate, findMatchingPayee, NewLifecarePayee } from '@utils/lifecare-payee';
import { paymentForMonth, toPaymentProposal } from '@utils/lifecare-payment-proposal';

import { LifecareAccessActionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { LifecarePayeeView, LifecarePaymentOptionsView, toPayeeView, toPaymentOptions } from '@/responses/lifecare-payment-options.response';
import { LifecareRegisteredPaymentView, toRegisteredPayments } from '@/responses/lifecare-registered-payment.response';
import { PaymentStatusView } from '@/responses/payment.response';

/**
 * The betalsätt and betalningsmottagare of an errand's insats, read and written in Lifecare — the
 * register of record for both. Nothing is kept in careM; careM only gets the access-log rows.
 */
class ErrandLifecarePaymentsService {
  private paymentsService = new LifecarePaymentsService();
  private serviceIds = new LifecareServiceIdService();
  private accessLog = new LifecareAccessLogService();
  private errandService = new CaremanagementErrandService();

  /**
   * Everything the utbetalning form needs, from Lifecare: betalsätt, payees, konteringsrader, saldon, the
   * months it may concern, and a proposal to start from.
   */
  async paymentOptions(errandId: string): Promise<LifecarePaymentOptionsView> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const [raw, registered] = await Promise.all([
      this.paymentsService.readPaymentForCreate(serviceId),
      this.paymentsService.readLatestPayments(serviceId),
    ]);
    await this.accessLog.logRead(errandId, { target: 'PAYEES', description: 'Läste utbetalningsunderlag i Lifecare' });
    return toPaymentOptions(raw, toPaymentProposal(raw, registered));
  }

  /**
   * Whether the utbetalning for the errand's month has been made, read from the insats's utbetalningar in
   * Lifecare. The month is the errand's own ansökningsmånad; `unavailable` when there is none or Lifecare
   * could not be read.
   */
  async paymentStatus(errandId: string): Promise<PaymentStatusView> {
    const view = await this.errandService.getFinancialAssistanceView(errandId);
    const month = view.data?.data?.periodMonth;
    const year = view.data?.data?.periodYear;
    const applicationMonth = month && year ? `${String(year)}-${String(month).padStart(2, '0')}` : undefined;
    if (!applicationMonth) {
      return { effectuated: false, unavailable: true };
    }
    try {
      const serviceId = await this.serviceIds.resolve(errandId);
      const registered = await this.paymentsService.readLatestPayments(serviceId);
      await this.accessLog.logRead(errandId, { target: 'PAYMENTS', description: 'Läste utbetalningar i Lifecare' });
      const payment = paymentForMonth(registered, applicationMonth);
      return {
        applicationMonth,
        effectuated: !!payment,
        paymentDate: payment?.payDate,
        amount: payment?.amount,
        status: payment?.statusText ?? undefined,
        unavailable: false,
      };
    } catch {
      // Lifecare being unreachable is a normal state for a status read — say so rather than fail.
      return { applicationMonth, effectuated: false, unavailable: true };
    }
  }

  /** The utbetalningar registered on the insats in Lifecare — what has actually been paid, or is on its way. */
  async registeredPayments(errandId: string): Promise<LifecareRegisteredPaymentView[]> {
    const serviceId = await this.serviceIds.resolve(errandId);
    const raw = await this.paymentsService.readLatestPayments(serviceId);
    await this.accessLog.logRead(errandId, { target: 'PAYMENTS', description: 'Läste utbetalningar i Lifecare' });
    return toRegisteredPayments(raw);
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
