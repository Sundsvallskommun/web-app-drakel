import authMiddleware from '@middlewares/auth.middleware';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import { Controller, Get, Param, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { DecisionsApiResponse, RecommendationApiResponse } from '@/responses/decision.response';
import { DecisionProposalApiResponse } from '@/responses/decision-proposal.response';

/**
 * careM's side of the beslut: the recommendation, the beslutsförslag and the decisions careM recorded.
 * Beslutstyper and orsaker are Lifecare's. The handläggare's beslut itself is saved in Lifecare — see LifecareDecisionController.
 */
@Controller()
export class DecisionController {
  private decisionService = new CaremanagementDecisionService();
  private errandService = new CaremanagementErrandService();

  @Get('/errands/:errandId/decisions')
  @OpenAPI({ summary: 'List the beslut recorded on an errand' })
  @ResponseSchema(DecisionsApiResponse)
  @UseBefore(authMiddleware)
  async listDecisions(@Param('errandId') errandId: string) {
    const res = await this.decisionService.readDecisions(errandId);
    return { data: res.data, message: 'success' };
  }

  @Get('/errands/:errandId/decisions/recommendation')
  @OpenAPI({ summary: 'The latest automated beslut recommendation on the errand (null when none)' })
  @ResponseSchema(RecommendationApiResponse)
  @UseBefore(authMiddleware)
  async getRecommendation(@Param('errandId') errandId: string) {
    const res = await this.errandService.getFinancialAssistanceView(errandId);
    return { data: res.data?.recommendation ?? null, message: 'success' };
  }

  @Get('/errands/:errandId/decision-proposal')
  @OpenAPI({ summary: 'The beslutsförslag for an errand (proposed outcome, period, amount and orsak)' })
  @ResponseSchema(DecisionProposalApiResponse)
  @UseBefore(authMiddleware)
  async getDecisionProposal(@Param('errandId') errandId: string) {
    const res = await this.decisionService.readDecisionProposal(errandId);
    return { data: res.data, message: 'success' };
  }
}
