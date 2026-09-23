import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * The automated beslut recommendation on an errand — a caremanagement Decision. Defined locally (like
 * {@link Warning}) mirroring the backend response. The handläggare's own beslut is kept in Lifecare.
 */
export interface Decision {
  id?: string;
  /** RECOMMENDATION (automated suggestion) or PAYMENT (handläggare beslut). */
  decisionType?: string;
  /** The chosen DecisionOption code. */
  value?: string;
  description?: string;
  /** Granted belopp in SEK (0 for an avslag); the recommended amount for a RECOMMENDATION. */
  amount?: number;
  decisionMessage?: string;
  decisionDate?: string;
  periodFrom?: string;
  periodTo?: string;
  createdBy?: string;
  created?: string;
}

/** Fetches the latest automated beslut recommendation for an errand (null when none has been produced). */
export const getBeslutRecommendation = (errandId: string): Promise<ServiceResponse<Decision | null>> =>
  apiService
    .get<ApiResponse<Decision | null>>(`errands/${errandId}/decisions/recommendation`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** The applicant's most recent Lifecare decision, shown beside the form for comparison. */
interface PreviousDecision {
  type?: string;
  reason?: string;
  coApplicant?: string;
  coApplicantReason?: string;
  periodFrom?: string;
  periodTo?: string;
  amount?: number;
  date?: string;
}

interface DecisionProposalWarning {
  id?: string;
  type?: string;
  /** The Swedish label to show; `type` is the machine code. */
  typeDisplayName?: string;
  message?: string;
  status?: string;
}

/**
 * The beslutsförslag for an errand — derived by caremanagement on every read from the calculation draft
 * and the previous Lifecare decision, never stored.
 *
 * The sökandes orsak is saved with the beslut in Lifecare. The medsökandes is shown and pickable but not
 * saved — a household with a medsökande cannot be registered from Drakel yet.
 */
export interface DecisionProposal {
  outcome?: string;
  outcomeOptions?: string[];
  periodFrom?: string;
  periodTo?: string;
  concernedMonth?: string;
  estimatedAmount?: number;
  normSum?: number;
  incomeSum?: number;
  expenseSum?: number;
  specialExpenseSum?: number;
  /** Why the proposal is incomplete (Swedish); absent when it is complete. */
  explanation?: string;
  reason?: string;
  /** The co-applicant's proposed orsak, from the same catalogue as the applicant's. */
  coApplicantReason?: string;
  reasonOptions?: string[];
  phraseText?: string;
  previousDecision?: PreviousDecision;
  warnings?: DecisionProposalWarning[];
}

/** Fetches the beslutsförslag for an errand. */
export const getDecisionProposal = (errandId: string): Promise<ServiceResponse<DecisionProposal>> =>
  apiService
    .get<ApiResponse<DecisionProposal>>(`errands/${errandId}/decision-proposal`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
