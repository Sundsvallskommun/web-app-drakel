import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';

import {
  LifecarePaymentCreated as CaremanagementLifecarePaymentCreated,
  LifecarePaymentRequest,
} from '@/data-contracts/caremanagement/data-contracts';
import { PaymentInputDto } from '@/dtos/payment.dto';
import { LifecarePaymentCreated, toPaymentCreated } from '@/responses/lifecare-payment-created.response';

/**
 * Registers the handläggare's utbetalning in Lifecare through careM, which makes it with `Payment/Create` and links
 * it to the errand.
 *
 * `Payment/Create` is not idempotent and moves money, so nothing here retries, and careM's refusals reach the
 * handläggare in careM's words: 422 when it cannot be made safely, 409 when Lifecare already holds a likadan
 * utbetalning, 502 when Lifecare did not answer and whether it paid is unknown. `linkedToErrand: false` means it IS
 * registered in Lifecare but the errand does not point at it — it must not be registered again.
 */
class LifecarePaymentRegistrationService {
  private apiService = new CaremanagementApiService();

  async register(errandId: string, input: PaymentInputDto): Promise<LifecarePaymentCreated> {
    const response = await this.apiService.post<CaremanagementLifecarePaymentCreated>({
      url: caremanagementLifecareUrl(errandId, 'payments'),
      data: input satisfies LifecarePaymentRequest,
    });
    return toPaymentCreated(response.data);
  }
}

export default LifecarePaymentRegistrationService;
