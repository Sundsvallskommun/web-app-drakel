import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';

import {
  LifecarePayee,
  LifecarePayeeRequest,
  LifecarePaymentOptions,
  LifecarePaymentStatus,
  LifecareRegisteredPayment,
} from '@/data-contracts/caremanagement/data-contracts';
import { CreateLifecarePayeeDto } from '@/dtos/lifecare-payee.dto';
import { LifecarePayeeView, LifecarePaymentOptionsView, toPayeeView, toPaymentOptionsView } from '@/responses/lifecare-payment-options.response';
import { LifecareRegisteredPaymentView, toRegisteredPaymentView } from '@/responses/lifecare-registered-payment.response';
import { PaymentStatusView, toPaymentStatusView } from '@/responses/payment.response';

/**
 * The utbetalningar, betalsätt and betalningsmottagare of an errand's insats, read and written in Lifecare through
 * careM. careM signs in, finds the insats and the personnummer from the errand, and logs every access itself; drakel
 * only passes the calls on. A read careM answers with 204 (nothing there) is `null`.
 */
class ErrandLifecarePaymentsService {
  private apiService = new CaremanagementApiService();

  /**
   * Everything the utbetalning form needs, from Lifecare: betalsätt, payees, konteringsrader, saldon, the months it may
   * concern, and a proposal to start from.
   */
  async paymentOptions(errandId: string): Promise<LifecarePaymentOptionsView | null> {
    const options = await this.apiService.getOrNull<LifecarePaymentOptions>({ url: caremanagementLifecareUrl(errandId, 'payment-options') });
    return options === null ? null : toPaymentOptionsView(options);
  }

  /**
   * Whether the utbetalning for the errand's month has been made. careM never fails this on Lifecare — it answers
   * `unavailable` — and a status careM has nothing to say about is `unavailable` too, so callers always get one.
   */
  async paymentStatus(errandId: string): Promise<PaymentStatusView> {
    const status = await this.apiService.getOrNull<LifecarePaymentStatus>({ url: caremanagementLifecareUrl(errandId, 'payment-status') });
    return status === null ? { effectuated: false, unavailable: true } : toPaymentStatusView(status);
  }

  /** The utbetalningar registered on the insats — what has actually been paid, or is on its way — newest first. */
  async registeredPayments(errandId: string): Promise<LifecareRegisteredPaymentView[] | null> {
    const payments = await this.apiService.getOrNull<LifecareRegisteredPayment[]>({ url: caremanagementLifecareUrl(errandId, 'payments') });
    return payments === null ? null : payments.map(toRegisteredPaymentView);
  }

  /**
   * Adds a betalningsmottagare in Lifecare, for the person the insats belongs to. careM returns an identical active
   * payee instead of creating it a second time, and refuses a betalsätt the insats does not use.
   */
  async createPayee(errandId: string, payee: CreateLifecarePayeeDto): Promise<LifecarePayeeView> {
    const response = await this.apiService.post<LifecarePayee>({
      url: caremanagementLifecareUrl(errandId, 'payees'),
      data: payee satisfies LifecarePayeeRequest,
    });
    return toPayeeView(response.data);
  }
}

export default ErrandLifecarePaymentsService;
