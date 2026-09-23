import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandFinalizeService from '@services/errand-finalize.service';
import { Body, Controller, Param, Post, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { FinalizeErrandDto } from '@/dtos/finalize.dto';
import { FinalizeApiResponse } from '@/responses/finalize.response';

/** "Besluta och utbetala" — finalizes a financial-assistance errand and sends the beslut to the applicant. */
@Controller()
export class FinalizeController {
  private finalizeService = new ErrandFinalizeService();

  @Post('/errands/:errandId/finalize')
  @OpenAPI({
    summary: 'Besluta och utbetala: finalize the errand in caremanagement from the saved beslut and utbetalning drafts, then send the beslut',
  })
  @ResponseSchema(FinalizeApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(FinalizeErrandDto, 'body'))
  async finalize(@Req() req: RequestWithUser, @Param('errandId') errandId: string, @Body() input: FinalizeErrandDto) {
    const result = await this.finalizeService.finalize(errandId, input, req.user.username);
    return { data: result, message: 'success' };
  }
}
