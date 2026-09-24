import authMiddleware from '@middlewares/auth.middleware';
import ErrandLifecareSectionStatusService from '@services/errand-lifecare-section-status.service';
import { Controller, Get, Param, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { LifecareSectionStatusApiResponse } from '@/responses/lifecare-section-status.response';

/** The checks on the errand's Normberäkning, Beslut and Utbetalning tabs, from their state in Lifecare. */
@Controller()
export class LifecareSectionStatusController {
  private statusService = new ErrandLifecareSectionStatusService();

  @Get('/errands/:errandId/lifecare-section-status')
  @OpenAPI({ summary: 'Whether the beräkning is slutlig, the beslut saved and the utbetalning registered in Lifecare' })
  @ResponseSchema(LifecareSectionStatusApiResponse)
  @UseBefore(authMiddleware)
  async read(@Param('errandId') errandId: string) {
    return { data: await this.statusService.read(errandId), message: 'success' };
  }
}
