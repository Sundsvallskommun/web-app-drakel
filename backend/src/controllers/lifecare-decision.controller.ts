import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import { Body, Controller, Get, Param, Put, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { SaveLifecareDecisionDto } from '@/dtos/lifecare-decision.dto';
import {
  LifecareDecisionApiResponse,
  LifecareDecisionPdfApiResponse,
  LifecareDecisionReasonsApiResponse,
  LifecareDecisionTypesApiResponse,
} from '@/responses/lifecare-decision.response';

/** The errand's beslut, read from, written to and printed by Lifecare. careM keeps only the reference. */
@Controller()
export class LifecareDecisionController {
  private decisionService = new ErrandLifecareDecisionService();

  @Get('/errands/:errandId/lifecare-decision')
  @OpenAPI({ summary: "The errand's beslut as it stands in Lifecare (null while none is saved)" })
  @ResponseSchema(LifecareDecisionApiResponse)
  @UseBefore(authMiddleware)
  async read(@Param('errandId') errandId: string) {
    return { data: (await this.decisionService.read(errandId)) ?? null, message: 'success' };
  }

  @Put('/errands/:errandId/lifecare-decision')
  @OpenAPI({ summary: "Save the errand's beslut in Lifecare — created the first time, changed after that" })
  @ResponseSchema(LifecareDecisionApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(SaveLifecareDecisionDto, 'body'))
  async save(@Req() req: RequestWithUser, @Param('errandId') errandId: string, @Body() input: SaveLifecareDecisionDto) {
    return { data: await this.decisionService.save(errandId, input, req.user.username), message: 'success' };
  }

  @Get('/errands/:errandId/lifecare-decision/types')
  @OpenAPI({ summary: "The beslutstyper the errand's insats offers in Lifecare" })
  @ResponseSchema(LifecareDecisionTypesApiResponse)
  @UseBefore(authMiddleware)
  async types(@Param('errandId') errandId: string) {
    return { data: await this.decisionService.types(errandId), message: 'success' };
  }

  @Get('/lifecare-decision-types/:decisionCode/reasons')
  @OpenAPI({ summary: 'The orsaker a beslut of the Lifecare beslutstyp can carry' })
  @ResponseSchema(LifecareDecisionReasonsApiResponse)
  @UseBefore(authMiddleware)
  async reasons(@Param('decisionCode') decisionCode: number) {
    return { data: await this.decisionService.reasons(decisionCode), message: 'success' };
  }

  @Get('/errands/:errandId/lifecare-decision/pdf')
  @OpenAPI({ summary: "The errand's beslut as Lifecare prints it, a PDF in base64" })
  @ResponseSchema(LifecareDecisionPdfApiResponse)
  @UseBefore(authMiddleware)
  async pdf(@Param('errandId') errandId: string) {
    const pdf = await this.decisionService.pdf(errandId);
    return { data: pdf.toString('base64'), message: 'success' };
  }
}
