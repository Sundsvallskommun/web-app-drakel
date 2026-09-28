import { Decision, DecisionProposalApiResponse, DecisionProposalView } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/**
 * The automated beslut recommendation on an errand — a caremanagement Decision. The handläggare's own beslut is
 * kept in Lifecare.
 */
export type { Decision };

/**
 * The beslutsförslag for an errand — derived by caremanagement on every read from the calculation draft
 * and the previous Lifecare decision, never stored.
 *
 * The sökandes orsak is saved with the beslut in Lifecare. The medsökandes is shown and pickable but not
 * saved — a household with a medsökande cannot be registered from Drakel yet.
 */
export type DecisionProposal = DecisionProposalView;

/** Fetches the latest automated beslut recommendation for an errand (null when none has been produced). */
export const getBeslutRecommendation = (errandId: string): Promise<ServiceResponse<Decision | null>> =>
  unwrapData(apiService.get<ApiResponse<Decision | null>>(apiPath`errands/${errandId}/decisions/recommendation`));

/** Fetches the beslutsförslag for an errand. */
export const getDecisionProposal = (errandId: string): Promise<ServiceResponse<DecisionProposal>> =>
  unwrapData(apiService.get<DecisionProposalApiResponse>(apiPath`errands/${errandId}/decision-proposal`));
