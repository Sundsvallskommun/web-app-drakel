import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementNormberakningService, { NormSection } from '@services/caremanagement-normberakning.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { NormHeaderInputDto, NormRowInputDto } from '@/dtos/normberakning.dto';
import { HttpException } from '@/exceptions/HttpException';
import { NormberakningDraftApiResponse } from '@/responses/normberakning.response';

const NORM_SECTIONS: readonly string[] = ['persons', 'incomes', 'expenses'];

/** Validates the section path segment so we never forward an unknown section to caremanagement. */
const toSection = (section: string): NormSection => {
  if (NORM_SECTIONS.includes(section)) {
    return section as NormSection;
  }
  throw new HttpException(400, `Unknown normberäkning section: ${section}`);
};

/**
 * Owns the draft normberäkning (persons · incomes · expenses) of a financial-assistance errand. Each
 * section is edited one row at a time; mutations return the affected row, so the frontend refetches the
 * draft for the recomputed sums.
 */
@Controller()
export class NormberakningController {
  private normberakningService = new CaremanagementNormberakningService();

  @Get('/errands/:errandId/normberakning/draft')
  @OpenAPI({ summary: 'Read the draft normberäkning (persons · incomes · expenses) for an errand' })
  @ResponseSchema(NormberakningDraftApiResponse)
  @UseBefore(authMiddleware)
  async getDraft(@Param('errandId') errandId: string) {
    const res = await this.normberakningService.readDraft(errandId);
    return { data: res.data, message: 'success' };
  }

  @Get('/normberakning/types')
  @OpenAPI({ summary: 'Labelled income/cost type catalogues for the add-row dropdowns' })
  @UseBefore(authMiddleware)
  async getTypes() {
    const res = await this.normberakningService.readTypes();
    return { data: res.data, message: 'success' };
  }

  @Patch('/errands/:errandId/normberakning/draft/header')
  @OpenAPI({ summary: 'Edit the draft normberäkning header (norm, dates, household size)' })
  @ResponseSchema(NormberakningDraftApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(NormHeaderInputDto, 'body'))
  async updateHeader(@Param('errandId') errandId: string, @Body() input: NormHeaderInputDto) {
    const res = await this.normberakningService.updateHeader(errandId, input);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/:errandId/normberakning/draft/:section')
  @OpenAPI({ summary: 'Add a handläggare row to a draft normberäkning section' })
  @UseBefore(authMiddleware, validationMiddleware(NormRowInputDto, 'body'))
  async addRow(
    @Param('errandId') errandId: string,
    @Param('section') section: string,
    @Body() input: NormRowInputDto
  ) {
    const res = await this.normberakningService.addRow(errandId, toSection(section), input);
    return { data: res.data, message: 'success' };
  }

  @Patch('/errands/:errandId/normberakning/draft/:section/:rowId')
  @OpenAPI({ summary: 'Set the handläggare value/note on a draft normberäkning row' })
  @UseBefore(authMiddleware, validationMiddleware(NormRowInputDto, 'body'))
  async updateRow(
    @Param('errandId') errandId: string,
    @Param('section') section: string,
    @Param('rowId') rowId: string,
    @Body() input: NormRowInputDto
  ) {
    const res = await this.normberakningService.updateRow(errandId, toSection(section), rowId, input);
    return { data: res.data, message: 'success' };
  }

  @Delete('/errands/:errandId/normberakning/draft/:section/:rowId')
  @OpenAPI({ summary: 'Soft-delete a draft normberäkning row' })
  @UseBefore(authMiddleware)
  async deleteRow(
    @Param('errandId') errandId: string,
    @Param('section') section: string,
    @Param('rowId') rowId: string
  ) {
    const res = await this.normberakningService.deleteRow(errandId, toSection(section), rowId);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/:errandId/normberakning/draft/:section/:rowId/restore')
  @OpenAPI({ summary: 'Restore a soft-deleted draft normberäkning row' })
  @UseBefore(authMiddleware)
  async restoreRow(
    @Param('errandId') errandId: string,
    @Param('section') section: string,
    @Param('rowId') rowId: string
  ) {
    const res = await this.normberakningService.restoreRow(errandId, toSection(section), rowId);
    return { data: res.data, message: 'success' };
  }
}
