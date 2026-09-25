import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandNormberakningService, { NormSection } from '@services/errand-normberakning.service';
import ErrandPreviousCalculationService from '@services/errand-previous-calculation.service';
import { Body, Controller, Delete, Get, Param, Patch, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { AddNormberakningRowParamsSectionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { NormHeaderInputDto, NormRowInputDto } from '@/dtos/normberakning.dto';
import { HttpException } from '@/exceptions/HttpException';
import { NormberakningDraftApiResponse, NormberakningTypesApiResponse } from '@/responses/normberakning.response';
import { PreviousCalculationApiResponse } from '@/responses/previous-calculation.response';

const NORM_SECTIONS: readonly string[] = Object.values(AddNormberakningRowParamsSectionEnum);

/** Validates the section path segment so we never forward an unknown section to caremanagement. */
const toSection = (section: string): NormSection => {
  if (NORM_SECTIONS.includes(section)) {
    return section as NormSection;
  }
  throw new HttpException(400, `Unknown normberäkning section: ${section}`);
};

/**
 * The Normberäkning tab's rows (persons · incomes · expenses) for a financial-assistance errand, through careM:
 * careM's draft until the beräkning is first saved in Lifecare, Lifecare's beräkning after that — careM decides.
 * Each section is edited one row at a time; the frontend reads the rows again for the recounted sums.
 */
@Controller()
export class NormberakningController {
  private normberakning = new ErrandNormberakningService();
  private previousCalculation = new ErrandPreviousCalculationService();

  @Get('/errands/:errandId/normberakning/draft')
  @OpenAPI({ summary: "Read the errand's normberäkning rows — careM's draft, or Lifecare's beräkning once saved there" })
  @ResponseSchema(NormberakningDraftApiResponse)
  @UseBefore(authMiddleware)
  async getDraft(@Param('errandId') errandId: string) {
    return { data: await this.normberakning.readDraft(errandId), message: 'success' };
  }

  @Get('/errands/:errandId/normberakning/previous')
  @OpenAPI({ summary: "The applicant's beräkning preceding the errand's own period, read from Lifecare (read-only)" })
  @ResponseSchema(PreviousCalculationApiResponse)
  @UseBefore(authMiddleware)
  async getPrevious(@Param('errandId') errandId: string) {
    return { data: await this.previousCalculation.read(errandId), message: 'success' };
  }

  @Get('/errands/:errandId/normberakning/types')
  @OpenAPI({ summary: "The income/cost types a new row can have — Lifecare's catalogues once the beräkning is saved there" })
  @ResponseSchema(NormberakningTypesApiResponse)
  @UseBefore(authMiddleware)
  async getTypes(@Param('errandId') errandId: string) {
    return { data: await this.normberakning.types(errandId), message: 'success' };
  }

  @Patch('/errands/:errandId/normberakning/draft/header')
  @OpenAPI({ summary: 'Edit the normberäkning header: norm, dates and household size in the careM draft; norm and household size in Lifecare' })
  @UseBefore(authMiddleware, validationMiddleware(NormHeaderInputDto, 'body'))
  async updateHeader(@Param('errandId') errandId: string, @Body() input: NormHeaderInputDto) {
    await this.normberakning.updateHeader(errandId, input);
    return { data: null, message: 'success' };
  }

  @Post('/errands/:errandId/normberakning/draft/:section')
  @OpenAPI({ summary: 'Add a handläggare row to a normberäkning section' })
  @UseBefore(authMiddleware, validationMiddleware(NormRowInputDto, 'body'))
  async addRow(@Param('errandId') errandId: string, @Param('section') section: string, @Body() input: NormRowInputDto) {
    await this.normberakning.addRow(errandId, toSection(section), input);
    return { data: null, message: 'success' };
  }

  @Patch('/errands/:errandId/normberakning/draft/:section/:rowId')
  @OpenAPI({ summary: 'Set the handläggare value/note on a normberäkning row' })
  @UseBefore(authMiddleware, validationMiddleware(NormRowInputDto, 'body'))
  async updateRow(
    @Param('errandId') errandId: string,
    @Param('section') section: string,
    @Param('rowId') rowId: string,
    @Body() input: NormRowInputDto,
  ) {
    await this.normberakning.updateRow(errandId, toSection(section), rowId, input);
    return { data: null, message: 'success' };
  }

  @Delete('/errands/:errandId/normberakning/draft/:section/:rowId')
  @OpenAPI({ summary: 'Remove a normberäkning row (a soft delete in the careM draft, dropped in Lifecare)' })
  @UseBefore(authMiddleware)
  async deleteRow(@Param('errandId') errandId: string, @Param('section') section: string, @Param('rowId') rowId: string) {
    await this.normberakning.deleteRow(errandId, toSection(section), rowId);
    return { data: null, message: 'success' };
  }

  @Post('/errands/:errandId/normberakning/draft/:section/:rowId/restore')
  @OpenAPI({ summary: 'Restore a soft-deleted draft normberäkning row; careM draft only' })
  @UseBefore(authMiddleware)
  async restoreRow(@Param('errandId') errandId: string, @Param('section') section: string, @Param('rowId') rowId: string) {
    await this.normberakning.restoreRow(errandId, toSection(section), rowId);
    return { data: null, message: 'success' };
  }
}
