import {
  CreateLifecarePayeeDto,
  LifecarePayeeApiResponse,
  LifecarePayeeView,
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

/**
 * Adds a betalningsmottagare straight in Lifecare. When Lifecare already has one paying to the same
 * account with the same betalsätt, that one comes back instead of a duplicate. A refusal carries
 * Lifecare's own reason in `message`.
 */
export const createLifecarePayee = (
  errandId: string,
  input: CreateLifecarePayeeDto
): Promise<ServiceResponse<LifecarePayeeView>> =>
  apiService
    .post<LifecarePayeeApiResponse>(`errands/${errandId}/lifecare-payees`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** The utbetalningar registered on the insats of the errand, read live from Lifecare. */
export const getLifecarePayments = (errandId: string): Promise<ServiceResponse<LifecareRegisteredPaymentView[]>> =>
  apiService
    .get<LifecareRegisteredPaymentsApiResponse>(`errands/${errandId}/lifecare-payments`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
