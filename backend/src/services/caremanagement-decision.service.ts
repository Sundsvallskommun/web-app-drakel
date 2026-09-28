import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementFinancialAssistanceUrl } from '@utils/caremanagement-url';

import { DecisionProposal, FinalizeRequest, FinalizeResponse } from '@/data-contracts/caremanagement/data-contracts';

/** careM's side of an errand's beslut: the beslutsförslag it derives, and the finalize that records the beslut. */
class CaremanagementDecisionService {
  private apiService = new CaremanagementApiService();

  /**
   * The beslutsförslag for an errand: proposed outcome, period and estimated amount, the previous
   * Lifecare decision and the DECISION-section warnings. Derived on every read, never stored.
   */
  async readDecisionProposal(errandId: string): Promise<ApiResponse<DecisionProposal>> {
    return this.apiService.get<DecisionProposal>({
      url: caremanagementFinancialAssistanceUrl(errandId, 'decision-proposal'),
    });
  }

  /**
   * "Skicka beräkning och beslut": careM reads the beslut saved in Lifecare (when the request names none), records it as
   * the PAYMENT decision, links it to the Lifecare beslut — reported back as `lifecareDecision` — and resumes the
   * process (which sets GRANTED/REJECTED). Sends nothing to the applicant — the caller does that through the
   * echoed channels. A beslut that cannot be finalized is a 400, a second finalize or the wrong status a 409.
   */
  async finalize(errandId: string, request: FinalizeRequest): Promise<ApiResponse<FinalizeResponse>> {
    return this.apiService.post<FinalizeResponse>({
      url: caremanagementFinancialAssistanceUrl(errandId, 'finalize'),
      data: request,
    });
  }
}

export default CaremanagementDecisionService;
