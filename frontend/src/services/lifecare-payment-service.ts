import {
  LifecarePaymentOptionsApiResponse,
  LifecarePaymentOptionsView,
  LifecareRegisteredPaymentsApiResponse,
  LifecareRegisteredPaymentView,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/** The betalsätt and betalningsmottagare on the insats of the errand — Lifecare's own lists. */
export const getLifecarePaymentOptions = (errandId: string): Promise<ServiceResponse<LifecarePaymentOptionsView>> =>
  apiService
    .get<LifecarePaymentOptionsApiResponse>(`errands/${errandId}/lifecare-payment-options`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

export const getLifecarePayments = (errandId: string): Promise<ServiceResponse<LifecareRegisteredPaymentView[]>> =>
  apiService
    .get<LifecareRegisteredPaymentsApiResponse>(`errands/${errandId}/lifecare-payments`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
