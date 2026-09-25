import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Decision, DecisionProposal, FinalizeRequest, FinalizeResponse } from '@/data-contracts/caremanagement/data-contracts';

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
   * "Besluta och utbetala": careM reads the beslut saved in Lifecare (when the request names none), records it as
   * the PAYMENT decision, links it to the Lifecare beslut — reported back as `lifecareDecision` — and resumes the
   * process (which sets GRANTED/REJECTED). Sends nothing to the applicant — the caller does that through the
   * echoed channels. A beslut that cannot be finalized is a 400, a second finalize or the wrong status a 409.
   */
  async finalize(errandId: string, request: FinalizeRequest): Promise<ApiResponse<FinalizeResponse>> {
    return this.apiService.post<FinalizeResponse>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'finalize'),
      data: request,
    });
  }
}

export default CaremanagementDecisionService;
