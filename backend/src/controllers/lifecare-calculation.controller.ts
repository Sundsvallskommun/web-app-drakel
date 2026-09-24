import authMiddleware from '@middlewares/auth.middleware';
import ErrandLifecareCalculationService from '@services/errand-lifecare-calculation.service';
import { Controller, Get, Param, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { LifecareCalculationApiResponse } from '@/responses/lifecare-calculation.response';

/** The errand's normberäkning in Lifecare: read back, and saved from careM's draft. careM keeps only the reference. */
@Controller()
export class LifecareCalculationController {
  private calculationService = new ErrandLifecareCalculationService();

  @Get('/errands/:errandId/lifecare-calculation')
  @OpenAPI({ summary: "The errand's normberäkning as it stands in Lifecare (null while none is saved)" })
  @ResponseSchema(LifecareCalculationApiResponse)
  @UseBefore(authMiddleware)
  async read(@Param('errandId') errandId: string) {
    return { data: (await this.calculationService.read(errandId)) ?? null, message: 'success' };
  }

  @Post('/errands/:errandId/lifecare-calculation')
  @OpenAPI({ summary: "Save the errand's draft normberäkning in Lifecare — created the first time, changed after that" })
  @ResponseSchema(LifecareCalculationApiResponse)
  @UseBefore(authMiddleware)
  async save(@Param('errandId') errandId: string) {
    return { data: await this.calculationService.save(errandId), message: 'success' };
  }
}
