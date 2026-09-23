import {
  LifecareDecisionApiResponse,
  LifecareDecisionPdfApiResponse,
  LifecareDecisionReasonsApiResponse,
  LifecareDecisionReasonView,
  LifecareDecisionTypesApiResponse,
  LifecareDecisionTypeView,
  LifecareDecisionView,
  SaveLifecareDecisionDto,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/** The errand's beslut as it stands in Lifecare; null while none has been saved. */
export const getLifecareDecision = (errandId: string): Promise<ServiceResponse<LifecareDecisionView | null>> =>
  apiService
    .get<LifecareDecisionApiResponse>(`errands/${errandId}/lifecare-decision`)
    .then((res) => ({ data: res.data.data ?? null }))
    .catch(toServiceError);

/** The beslutstyper the errand's insats offers in Lifecare. */
export const getLifecareDecisionTypes = (errandId: string): Promise<ServiceResponse<LifecareDecisionTypeView[]>> =>
  apiService
    .get<LifecareDecisionTypesApiResponse>(`errands/${errandId}/lifecare-decision/types`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** The orsaker a beslut of the Lifecare beslutstyp can carry. */
export const getLifecareDecisionReasons = (
  decisionCode: number
): Promise<ServiceResponse<LifecareDecisionReasonView[]>> =>
  apiService
    .get<LifecareDecisionReasonsApiResponse>(`lifecare-decision-types/${String(decisionCode)}/reasons`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/**
 * Saves the beslut straight to Lifecare — created the first time, changed after that. On a refusal
 * (`error`) `message` carries the reason in words the handläggare can act on.
 */
export const saveLifecareDecision = (
  errandId: string,
  input: SaveLifecareDecisionDto
): Promise<ServiceResponse<LifecareDecisionView>> =>
  apiService
    .put<LifecareDecisionApiResponse>(`errands/${errandId}/lifecare-decision`, input)
    .then((res) => (res.data.data ? { data: res.data.data } : { error: true }))
    .catch(toServiceError);

/** The saved beslut as Lifecare prints it — a PDF in base64. */
export const getLifecareDecisionPdf = (errandId: string): Promise<ServiceResponse<string>> =>
  apiService
    .get<LifecareDecisionPdfApiResponse>(`errands/${errandId}/lifecare-decision/pdf`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
