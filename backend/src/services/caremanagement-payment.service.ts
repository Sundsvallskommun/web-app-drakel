import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Payment, PaymentProposal, PaymentStatusRequest, PaymentStatusResponse } from '@/data-contracts/caremanagement/data-contracts';
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
   * Creates an utbetalning on the errand. caremanagement stores it as DRAFT and queues nothing — the
   * robot is started separately through the REGISTER_PAYMENT RPA task, so a handläggare can save a
   * draft without setting anything in motion.
   */
  async createPayment(errandId: string, input: PaymentInputDto): Promise<ApiResponse<Payment>> {
    return this.apiService.post<Payment>({ url: this.paymentsUrl(errandId), data: input });
  }
}

export default CaremanagementPaymentService;
