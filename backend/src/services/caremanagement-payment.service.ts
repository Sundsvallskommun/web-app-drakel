import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { PaymentProposal, PaymentStatusRequest, PaymentStatusResponse } from '@/data-contracts/caremanagement/data-contracts';

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
}

export default CaremanagementPaymentService;
