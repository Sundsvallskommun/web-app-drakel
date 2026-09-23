import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { PayeeOption, Payment, PaymentProposal, PaymentStatusRequest, PaymentStatusResponse } from '@/data-contracts/caremanagement/data-contracts';
import { PayeeInputDto, PaymentInputDto } from '@/dtos/payment.dto';

/** Reads the Lifecare utbetalning status and the utbetalningsförslag for a financial-assistance errand. */
class CaremanagementPaymentService {
  private apiService = new CaremanagementApiService();

  async readPaymentStatus(applicant: string, applicationMonth: string): Promise<ApiResponse<PaymentStatusResponse>> {
    const body: PaymentStatusRequest = { applicant, applicationMonth };
    return this.apiService.post<PaymentStatusResponse>({
      url: caremanagementUrl('errands', 'financial-assistance', 'payment-status'),
      data: body,
    });
  }

  /**
   * The utbetalningsförslag for an errand: proposed date/amount/payee, the payee alternatives seen on the
   * applicant's Lifecare payments, and the PAYMENT-section warnings. Derived on every read, never stored.
   */
  async readPaymentProposal(errandId: string): Promise<ApiResponse<PaymentProposal>> {
    return this.apiService.get<PaymentProposal>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'payment-proposal'),
    });
  }

  private paymentsUrl(errandId: string, ...rest: string[]): string {
    return caremanagementUrl('errands', 'financial-assistance', errandId, 'payments', ...rest);
  }

  /**
   * The utbetalningar stored on the errand — both the ones a handläggare saved here and the ones
   * finalize created, which arrive already handed to the robot.
   */
  async listPayments(errandId: string): Promise<ApiResponse<Payment[]>> {
    return this.apiService.get<Payment[]>({ url: this.paymentsUrl(errandId) });
  }

  /**
   * Creates an utbetalning on the errand. caremanagement stores it as DRAFT and queues nothing — the
   * robot is started separately through the REGISTER_PAYMENT RPA task, so a handläggare can save a
   * draft without setting anything in motion.
   */
  async createPayment(errandId: string, input: PaymentInputDto): Promise<ApiResponse<Payment>> {
    return this.apiService.post<Payment>({ url: this.paymentsUrl(errandId), data: input });
  }

  /** Removes an utbetalning from the errand. */
  async deletePayment(errandId: string, paymentId: string): Promise<ApiResponse<null>> {
    return this.apiService.delete<null>({ url: this.paymentsUrl(errandId, paymentId) });
  }

  private payeesUrl(errandId: string, ...rest: string[]): string {
    return caremanagementUrl('errands', 'financial-assistance', errandId, 'payees', ...rest);
  }

  /**
   * The selectable betalningsmottagare: the ones seen on the applicant's Lifecare payments the last 12
   * months, then the ones added by hand on the errand. Unlike the payment proposal this reads nothing
   * else and needs no calculation, so it is safe to call just to fill a dropdown — and the Lifecare read
   * is best-effort, so an outage yields the manual rows rather than an error.
   */
  async listPayees(errandId: string): Promise<ApiResponse<PayeeOption[]>> {
    return this.apiService.get<PayeeOption[]>({ url: this.payeesUrl(errandId) });
  }

  /**
   * Adds a betalningsmottagare by hand and queues the robot that writes it into Lifecare. An identical
   * payee is reused rather than duplicated, so a double click is harmless.
   */
  async createPayee(errandId: string, input: PayeeInputDto): Promise<ApiResponse<PayeeOption>> {
    return this.apiService.post<PayeeOption>({ url: this.payeesUrl(errandId), data: input });
  }

  /** Removes a manually added betalningsmottagare. */
  async deletePayee(errandId: string, payeeId: string): Promise<ApiResponse<null>> {
    return this.apiService.delete<null>({ url: this.payeesUrl(errandId, payeeId) });
  }
}

export default CaremanagementPaymentService;
