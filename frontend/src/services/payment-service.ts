import { PaymentStatusApiResponse, PaymentStatusView } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/**
 * Fetches whether the Lifecare utbetalning for an errand's application month has been effectuated, read from the
 * insats's utbetalningar in Lifecare. `unavailable` is true when the status could not be determined (no
 * ansökningsmånad, or Lifecare did not respond).
 */
export const getPaymentStatus = (errandId: string): Promise<ServiceResponse<PaymentStatusView>> =>
  unwrapData(apiService.get<PaymentStatusApiResponse>(apiPath`errands/${errandId}/payment-status`));
