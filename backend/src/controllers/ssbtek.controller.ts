import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandSsbtekService from '@services/errand-ssbtek.service';
import ErrandSsbtekTransferService from '@services/errand-ssbtek-transfer.service';
import { Body, Controller, Get, Param, Post, QueryParams, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { SsbtekPeriodQueryDto } from '@/dtos/ssbtek.dto';
import { SsbtekTransferDto } from '@/dtos/ssbtek-transfer.dto';
import { SsbtekPaymentsApiResponse } from '@/responses/ssbtek.response';
import { SsbtekChangesApiResponse } from '@/responses/ssbtek-changes.response';

/** What SSBTEK reports for the errand's sökande and medsökande, fetched live through careM. */
@Controller()
export class SsbtekController {
  private ssbtekService = new ErrandSsbtekService();
  private transferService = new ErrandSsbtekTransferService();

  @Get('/errands/:errandId/ssbtek/payments')
  @OpenAPI({ summary: 'The payments SSBTEK reports to the sökande and any medsökande in the period, newest first' })
  @ResponseSchema(SsbtekPaymentsApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(SsbtekPeriodQueryDto, 'query'))
  async readPayments(@Param('errandId') errandId: string, @QueryParams() period: SsbtekPeriodQueryDto) {
    return { data: await this.ssbtekService.readPayments(errandId, period), message: 'success' };
  }

  @Get('/errands/:errandId/ssbtek/changes')
  @OpenAPI({ summary: 'Where SSBTEK and the normberäkning in Lifecare disagree, per income type and person — what can be transferred' })
  @ResponseSchema(SsbtekChangesApiResponse)
  @UseBefore(authMiddleware)
  async readChanges(@Param('errandId') errandId: string) {
    return { data: await this.transferService.readChanges(errandId), message: 'success' };
  }

  @Post('/errands/:errandId/ssbtek/changes/transfer')
  @OpenAPI({
    summary: "Transfers the picked incomes, at SSBTEK's amounts, into the normberäkning; careM records them so they are not transferred again",
  })
  @ResponseSchema(SsbtekChangesApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(SsbtekTransferDto, 'body'))
  async transfer(@Param('errandId') errandId: string, @Body() request: SsbtekTransferDto) {
    return { data: await this.transferService.transfer(errandId, request), message: 'success' };
  }
}
