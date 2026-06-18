import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import { Body, Controller, Get, HttpCode, Param, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { Decision } from '@/data-contracts/caremanagement/data-contracts';
import { CreateDecisionDto } from '@/dtos/decision.dto';
import {
  DecisionApiResponse,
  DecisionOptionsApiResponse,
  DecisionsApiResponse,
  RecommendationApiResponse,
} from '@/responses/decision.response';

// The beslutsalternativ catalog lives on the errand-type schema, keyed by the registry typeSlug
// (e.g. financial-assistance-new). Fall back to the NEW variant when an errand has no typeSlug.
const DEFAULT_TYPE_SLUG = 'financial-assistance-new';

/** Owns the beslut (decision) sub-resource of an errand: the catalog, the recommendation and saving. */
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

  @Get('/errands/:errandId/decisions/options')
  @OpenAPI({ summary: 'List the allowed beslutsalternativ for the errand type' })
  @ResponseSchema(DecisionOptionsApiResponse)
  @UseBefore(authMiddleware)
  async listDecisionOptions(@Param('errandId') errandId: string) {
    // The catalog is per errand type, so resolve the errand's typeSlug (e.g. financial-assistance-new).
    const errand = await this.errandService.getErrand(errandId);
    const res = await this.decisionService.readDecisionOptions(errand.data?.typeSlug ?? DEFAULT_TYPE_SLUG);
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

  @Post('/errands/:errandId/decisions')
  @HttpCode(201)
  @OpenAPI({ summary: 'Record a beslut on an errand' })
  @ResponseSchema(DecisionApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(CreateDecisionDto, 'body'))
  async createDecision(@Param('errandId') errandId: string, @Body() input: CreateDecisionDto) {
    // A handläggare-recorded beslut is a PAYMENT decision unless the caller says otherwise.
    const decision: Decision = {
      decisionType: input.decisionType ?? 'PAYMENT',
      value: input.value,
      amount: input.amount,
      decisionDate: input.decisionDate,
      periodFrom: input.periodFrom,
      periodTo: input.periodTo,
      decisionMessage: input.decisionMessage,
      description: input.description,
    };
    const res = await this.decisionService.createDecision(errandId, decision);
    return { data: res.data, message: 'success' };
  }
}
