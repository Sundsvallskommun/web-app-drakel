import {
  LifecarePaymentCreated,
  LifecarePaymentCreatedApiResponse,
  LifecarePaymentOptionsApiResponse,
  LifecarePaymentOptionsView,
  LifecareRegisteredPaymentsApiResponse,
  LifecareRegisteredPaymentView,
  PaymentInputDto,
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

/**
 * Registers the utbetalning in Lifecare straight away — careM keeps no copy. On a refusal (`error`)
 * `message` says why, in Lifecare's or Drakel's words: a saldo that does not cover it, a likadan
 * utbetalning already made, or Lifecare's own reason.
 */
export const registerLifecarePayment = (
  errandId: string,
  input: PaymentInputDto
): Promise<ServiceResponse<LifecarePaymentCreated>> =>
  apiService
    .post<LifecarePaymentCreatedApiResponse>(`errands/${errandId}/lifecare-payments`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
