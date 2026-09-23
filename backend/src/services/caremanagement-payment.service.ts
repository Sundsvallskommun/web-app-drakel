import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import {
  Payment,
  PaymentLifecareResult,
  PaymentProposal,
  PaymentStatusRequest,
  PaymentStatusResponse,
} from '@/data-contracts/caremanagement/data-contracts';
import { PaymentInputDto } from '@/dtos/payment.dto';

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

  /** One utbetalning with everything Lifecare needs to register it: payee, account and address. */
  async readPayment(errandId: string, paymentId: string): Promise<ApiResponse<Payment>> {
    return this.apiService.get<Payment>({ url: this.paymentsUrl(errandId, paymentId) });
  }

  /**
   * Tells careM what happened when the utbetalning was written to Lifecare — the only thing that moves it
   * out of PENDING_REGISTRATION. REGISTERED and ALREADY_EXISTS both make it REGISTERED; FAILED needs
   * Lifecare's own reason, which is shown to the handläggare as it came.
   */
  async reportLifecareResult(errandId: string, paymentId: string, result: PaymentLifecareResult): Promise<void> {
    await this.apiService.post<null>({ url: this.paymentsUrl(errandId, paymentId, 'lifecare-result'), data: result });
  }

  /** Removes an utbetalning from the errand. */
  async deletePayment(errandId: string, paymentId: string): Promise<ApiResponse<null>> {
    return this.apiService.delete<null>({ url: this.paymentsUrl(errandId, paymentId) });
  }
}

export default CaremanagementPaymentService;
