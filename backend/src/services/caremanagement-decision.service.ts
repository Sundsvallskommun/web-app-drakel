import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import {
  Decision,
  DecisionLifecareResult,
  DecisionProposal,
  FinalizeRequest,
  FinalizeResponse,
} from '@/data-contracts/caremanagement/data-contracts';

/**
 * Owns the decisions sub-resource of an errand (the beslut audit trail) plus the beslutsalternativ
 * catalog, which lives on the errand-type schema.
 */
class CaremanagementDecisionService {
  private apiService = new CaremanagementApiService();

  async readDecisions(errandId: string): Promise<ApiResponse<Decision[]>> {
    return this.apiService.get<Decision[]>({ url: caremanagementUrl('errands', errandId, 'decisions') });
  }

  /**
   * The beslutsförslag for an errand: proposed outcome, period and estimated amount, the previous
   * Lifecare decision and the DECISION-section warnings. Derived on every read, never stored.
   */
  async readDecisionProposal(errandId: string): Promise<ApiResponse<DecisionProposal>> {
    return this.apiService.get<DecisionProposal>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'decision-proposal'),
    });
  }

  /**
   * Tells careM what happened when the beslut was written to Lifecare. WRITTEN and ALREADY_EXISTS store
   * Lifecare's id on the beslut; FAILED needs Lifecare's own reason, shown to the handläggare as it came.
   */
  async reportLifecareResult(errandId: string, decisionId: string, result: DecisionLifecareResult): Promise<void> {
    await this.apiService.post<null>({ url: caremanagementUrl('errands', errandId, 'decisions', decisionId, 'lifecare-result'), data: result });
  }

  /**
   * "Besluta och utbetala": records the PAYMENT decision with its orsak, period and amount, creates the
   * payment rows, queues the Lifecare write-backs and resumes the process (which sets GRANTED/REJECTED).
   * Sends nothing to the applicant — the caller does that through the echoed channels. A second finalize,
   * the wrong status or unapproved sections are a 409.
   */
  async finalize(errandId: string, request: FinalizeRequest): Promise<ApiResponse<FinalizeResponse>> {
    return this.apiService.post<FinalizeResponse>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'finalize'),
      data: request,
    });
  }
}

export default CaremanagementDecisionService;
