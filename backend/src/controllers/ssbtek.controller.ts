import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandSsbtekService from '@services/errand-ssbtek.service';
import { Controller, Get, Param, QueryParams, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { SsbtekQueryDto } from '@/dtos/ssbtek.dto';
import { SsbtekPaymentsApiResponse } from '@/responses/ssbtek.response';

/** What SSBTEK reports for the errand's sökande or medsökande, fetched live through careM. */
@Controller()
export class SsbtekController {
  private ssbtekService = new ErrandSsbtekService();

  @Get('/errands/:errandId/ssbtek/payments')
  @OpenAPI({ summary: 'The payments SSBTEK reports to the sökande (or medsökande) in the period, newest first' })
  @ResponseSchema(SsbtekPaymentsApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(SsbtekQueryDto, 'query'))
  async readPayments(@Param('errandId') errandId: string, @QueryParams() query: SsbtekQueryDto) {
    return { data: await this.ssbtekService.readPayments(errandId, query), message: 'success' };
  }
}
