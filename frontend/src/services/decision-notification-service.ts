import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** The Messaging channels the beslut is sent through. */
export interface DecisionChannels {
  minaSidor: boolean;
  digitalBrevlada: boolean;
  brev: boolean;
}

/** Whether the applicant has a reachable digital mailbox (so the "Digital brevlåda" channel is offered). */
export const getDigitalMailbox = (errandId: string): Promise<ServiceResponse<boolean>> =>
  apiService
    .get<ApiResponse<{ available: boolean }>>(`errands/${errandId}/digital-mailbox`)
    .then((res) => ({ data: res.data.data.available }))
    .catch(toServiceError);

/**
 * Renders the beslut PDF, saves it as a DECISION attachment and sends it through the chosen channels.
 * Resolves with the labels of any channels that failed (empty when all selected channels succeeded); a
 * rejected promise (`error`) means every selected channel failed.
 */
export const sendDecisionNotification = (
  errandId: string,
  channels: DecisionChannels
): Promise<ServiceResponse<string[]>> =>
  apiService
    .post<ApiResponse<{ failedChannels: string[] }>>(`errands/${errandId}/decision-notification`, channels)
    .then((res) => ({ data: res.data.data.failedChannels ?? [] }))
    .catch(toServiceError);
