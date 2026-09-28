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
import { apiService, mapData, toServiceError, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/** The errand's beslut as it stands in Lifecare; null while none has been saved. */
export const getLifecareDecision = (errandId: string): Promise<ServiceResponse<LifecareDecisionView | null>> =>
  mapData(
    apiService.get<LifecareDecisionApiResponse>(apiPath`errands/${errandId}/lifecare-decision`),
    (decision) => decision ?? null
  );

/** The beslutstyper the errand's insats offers in Lifecare. */
export const getLifecareDecisionTypes = (errandId: string): Promise<ServiceResponse<LifecareDecisionTypeView[]>> =>
  unwrapData(apiService.get<LifecareDecisionTypesApiResponse>(apiPath`errands/${errandId}/lifecare-decision/types`));

/** The orsaker a beslut of the Lifecare beslutstyp can carry. */
export const getLifecareDecisionReasons = (
  decisionCode: number
): Promise<ServiceResponse<LifecareDecisionReasonView[]>> =>
  unwrapData(
    apiService.get<LifecareDecisionReasonsApiResponse>(apiPath`lifecare-decision-types/${decisionCode}/reasons`)
  );

/**
 * Saves the beslut straight to Lifecare — created the first time, changed after that. On a refusal
 * (`error`) `message` carries the reason in words the handläggare can act on.
 */
export const saveLifecareDecision = (
  errandId: string,
  input: SaveLifecareDecisionDto
): Promise<ServiceResponse<LifecareDecisionView>> =>
  apiService
    .put<LifecareDecisionApiResponse>(apiPath`errands/${errandId}/lifecare-decision`, input)
    .then((res) => (res.data.data ? { data: res.data.data } : { error: true }))
    .catch(toServiceError);

/** The saved beslut as Lifecare prints it — a PDF in base64. */
export const getLifecareDecisionPdf = (errandId: string): Promise<ServiceResponse<string>> =>
  unwrapData(apiService.get<LifecareDecisionPdfApiResponse>(apiPath`errands/${errandId}/lifecare-decision/pdf`));
