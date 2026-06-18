import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { PaymentStatusRequest, PaymentStatusResponse } from '@/data-contracts/caremanagement/data-contracts';

/** Reads the Lifecare utbetalning status for a financial-assistance errand's application month. */
class CaremanagementPaymentService {
  private apiService = new CaremanagementApiService();

  async readPaymentStatus(applicant: string, applicationMonth: string): Promise<ApiResponse<PaymentStatusResponse>> {
    const body: PaymentStatusRequest = { applicant, applicationMonth };
    return this.apiService.post<PaymentStatusResponse>({
      url: caremanagementUrl('errands', 'financial-assistance', 'payment-status'),
      data: body,
    });
  }
}

export default CaremanagementPaymentService;
