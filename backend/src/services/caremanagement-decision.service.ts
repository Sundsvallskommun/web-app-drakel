import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import {
  Decision,
  DecisionOption,
  DecisionProposal,
  ErrandTypeSchema,
  FinalizeRequest,
  FinalizeResponse,
} from '@/data-contracts/caremanagement/data-contracts';

/** Extracts the decision id (last path segment) from a caremanagement Location header. */
const decisionIdFromLocation = (location?: string): string | undefined => location?.split('/').filter(Boolean).pop();

/**
 * Owns the decisions sub-resource of an errand (the beslut audit trail) plus the beslutsalternativ
 * catalog, which lives on the errand-type schema.
 */
class CaremanagementDecisionService {
  private apiService = new CaremanagementApiService();

  async readDecisions(errandId: string): Promise<ApiResponse<Decision[]>> {
    return this.apiService.get<Decision[]>({ url: caremanagementUrl('errands', errandId, 'decisions') });
  }

  async getDecision(errandId: string, decisionId: string): Promise<ApiResponse<Decision>> {
    return this.apiService.get<Decision>({ url: caremanagementUrl('errands', errandId, 'decisions', decisionId) });
  }

  /**
   * Records a beslut. caremanagement returns "201 Created" with a Location header and an empty body
   * (like createErrand), so we resolve the created decision by the id in that Location.
   */
  async createDecision(errandId: string, decision: Decision): Promise<ApiResponse<Decision>> {
    const created = await this.apiService.post<Decision>({
      url: caremanagementUrl('errands', errandId, 'decisions'),
      data: decision,
    });
    const decisionId = decisionIdFromLocation(created.location);
    return decisionId ? this.getDecision(errandId, decisionId) : created;
  }

  /** The allowed beslutsalternativ for an errand type (empty when the type defines none). */
  async readDecisionOptions(typeSlug: string): Promise<ApiResponse<DecisionOption[]>> {
    const res = await this.apiService.get<ErrandTypeSchema>({ url: caremanagementUrl('errand-types', typeSlug) });
    return { data: res.data?.decisionOptions ?? [], message: res.message };
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
