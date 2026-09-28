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
import { apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/** The betalsätt and betalningsmottagare on the insats of the errand — Lifecare's own lists. */
export const getLifecarePaymentOptions = (errandId: string): Promise<ServiceResponse<LifecarePaymentOptionsView>> =>
  unwrapData(apiService.get<LifecarePaymentOptionsApiResponse>(apiPath`errands/${errandId}/lifecare-payment-options`));

export const getLifecarePayments = (errandId: string): Promise<ServiceResponse<LifecareRegisteredPaymentView[]>> =>
  unwrapData(apiService.get<LifecareRegisteredPaymentsApiResponse>(apiPath`errands/${errandId}/lifecare-payments`));

/**
 * Registers the utbetalning in Lifecare straight away — careM keeps no copy. On a refusal (`error`)
 * `message` says why, in Lifecare's or Drakel's words: a saldo that does not cover it, a likadan
 * utbetalning already made, or Lifecare's own reason.
 */
export const registerLifecarePayment = (
  errandId: string,
  input: PaymentInputDto
): Promise<ServiceResponse<LifecarePaymentCreated>> =>
  unwrapData(apiService.post<LifecarePaymentCreatedApiResponse>(apiPath`errands/${errandId}/lifecare-payments`, input));
