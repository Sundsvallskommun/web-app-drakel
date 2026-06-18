import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * Whether the Lifecare utbetalning for an errand's application month has been effectuated. Defined
 * locally (like {@link Warning}) mirroring the backend response. `unavailable` is true when the status
 * could not be determined (missing applicant/month, or Lifecare did not respond).
 */
export interface PaymentStatus {
  applicationMonth?: string;
  effectuated: boolean;
  paymentDate?: string;
  unavailable: boolean;
}

/** Fetches the Lifecare utbetalning status for an errand. */
export const getPaymentStatus = (errandId: string): Promise<ServiceResponse<PaymentStatus>> =>
  apiService
    .get<ApiResponse<PaymentStatus>>(`errands/${errandId}/payment-status`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
