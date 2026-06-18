import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import { Body, Controller, Get, Param, Put, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { UpdateNormberakningDraftDto } from '@/dtos/normberakning.dto';
import { NormberakningDraftApiResponse } from '@/responses/normberakning.response';

/** Owns the draft normberäkning (income rows) sub-resource of a financial-assistance errand. */
@Controller()
export class NormberakningController {
  private normberakningService = new CaremanagementNormberakningService();

  @Get('/errands/:errandId/normberakning/draft')
  @OpenAPI({ summary: 'Read the draft normberäkning (income rows) for an errand' })
  @ResponseSchema(NormberakningDraftApiResponse)
  @UseBefore(authMiddleware)
  async getDraft(@Param('errandId') errandId: string) {
    const res = await this.normberakningService.readDraft(errandId);
    return { data: res.data, message: 'success' };
  }

  @Put('/errands/:errandId/normberakning/draft')
  @OpenAPI({ summary: 'Edit the draft normberäkning (income rows) for an errand' })
  @ResponseSchema(NormberakningDraftApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(UpdateNormberakningDraftDto, 'body'))
  async updateDraft(@Param('errandId') errandId: string, @Body() draft: UpdateNormberakningDraftDto) {
    const res = await this.normberakningService.updateDraft(errandId, draft.rows);
    return { data: res.data, message: 'success' };
  }
}
