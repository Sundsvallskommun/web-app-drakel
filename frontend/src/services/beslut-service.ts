import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * An allowed beslutsalternativ for the errand type (caremanagement DecisionOption). `carriesAmount:
 * false` marks an avslag — an outcome that grants no belopp.
 */
export interface BeslutOption {
  code?: string;
  displayName?: string;
  carriesAmount?: boolean;
}

/**
 * A beslut (or automated recommendation) on an errand — the caremanagement Decision. Defined locally
 * (like {@link Warning}) mirroring the backend response.
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

/** The fields sent when recording a beslut. */
export interface CreateBeslutInput {
  value: string;
  amount?: number;
  decisionDate?: string;
  periodFrom?: string;
  periodTo?: string;
  decisionMessage?: string;
  description?: string;
}

/** Fetches the allowed beslutsalternativ for an errand. */
export const getBeslutOptions = (errandId: string): Promise<ServiceResponse<BeslutOption[]>> =>
  apiService
    .get<ApiResponse<BeslutOption[]>>(`errands/${errandId}/decisions/options`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Fetches the latest automated beslut recommendation for an errand (null when none has been produced). */
export const getBeslutRecommendation = (errandId: string): Promise<ServiceResponse<Decision | null>> =>
  apiService
    .get<ApiResponse<Decision | null>>(`errands/${errandId}/decisions/recommendation`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/**
 * The handläggare's latest saved beslut — the newest decision that actually carries a beslutsmeddelande —
 * used to read the form (including the message) back when the Beslut tab is reopened. Null when none has
 * been saved. Matching on the message (rather than just "newest") mirrors the send flow and skips any
 * message-less decision the errand may gain later (e.g. when it is decided/closed), which would otherwise
 * blank the editor.
 */
export const getLatestBeslut = (errandId: string): Promise<ServiceResponse<Decision | null>> =>
  apiService
    .get<ApiResponse<Decision[]>>(`errands/${errandId}/decisions`)
    .then((res) => {
      const decisions = res.data.data ?? [];
      const latest = [...decisions].reverse().find((decision) => (decision.decisionMessage ?? '').trim().length > 0);
      return { data: latest ?? null };
    })
    .catch(toServiceError);

/** Records a beslut on an errand. */
export const createBeslut = (errandId: string, input: CreateBeslutInput): Promise<ServiceResponse<Decision>> =>
  apiService
    .post<ApiResponse<Decision>>(`errands/${errandId}/decisions`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** The applicant's most recent Lifecare decision, shown beside the form for comparison. */
interface PreviousDecision {
  type?: string;
  reason?: string;
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
 * `reason`, `reasonOptions` and `phraseText` belong to the finalize payload ("Besluta och utbetala"),
 * not to the plain decision POST, so they are read here but not yet editable in the form.
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
