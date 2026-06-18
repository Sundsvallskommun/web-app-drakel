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

/** Records a beslut on an errand. */
export const createBeslut = (errandId: string, input: CreateBeslutInput): Promise<ServiceResponse<Decision>> =>
  apiService
    .post<ApiResponse<Decision>>(`errands/${errandId}/decisions`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
