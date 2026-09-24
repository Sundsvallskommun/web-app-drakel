import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * Whether the Lifecare utbetalning for an errand's application month has been effectuated, read from the
 * insats's utbetalningar in Lifecare. `unavailable` is true when the status could not be determined (no
 * ansökningsmånad, or Lifecare did not respond).
 */
export interface PaymentStatus {
  applicationMonth?: string;
  effectuated: boolean;
  paymentDate?: string;
  /** The belopp of that utbetalning, when effectuated. */
  amount?: number;
  /** Lifecare's own status for that utbetalning, e.g. "Utbetald". */
  status?: string;
  unavailable: boolean;
}

/** Fetches the Lifecare utbetalning status for an errand. */
export const getPaymentStatus = (errandId: string): Promise<ServiceResponse<PaymentStatus>> =>
  apiService
    .get<ApiResponse<PaymentStatus>>(`errands/${errandId}/payment-status`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
