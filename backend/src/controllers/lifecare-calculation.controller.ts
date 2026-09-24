import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandLifecareCalculationService from '@services/errand-lifecare-calculation.service';
import { Body, Controller, Get, Param, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { SaveLifecareCalculationDto } from '@/dtos/lifecare-calculation.dto';
import { LifecareCalculationApiResponse, LifecareCalculationPdfApiResponse } from '@/responses/lifecare-calculation.response';

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

  @Get('/errands/:errandId/lifecare-calculation/pdf')
  @OpenAPI({ summary: "The errand's normberäkning as Lifecare prints it, a PDF in base64 (404 while none is saved)" })
  @ResponseSchema(LifecareCalculationPdfApiResponse)
  @UseBefore(authMiddleware)
  async pdf(@Param('errandId') errandId: string) {
    const pdf = await this.calculationService.pdf(errandId);
    return { data: pdf.toString('base64'), message: 'success' };
  }

  @Post('/errands/:errandId/lifecare-calculation')
  @OpenAPI({ summary: "Save the errand's draft normberäkning in Lifecare — created the first time, changed after that; optionally as slutlig" })
  @ResponseSchema(LifecareCalculationApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(SaveLifecareCalculationDto, 'body'))
  async save(@Param('errandId') errandId: string, @Body() input: SaveLifecareCalculationDto) {
    return { data: await this.calculationService.save(errandId, input.finalize === true), message: 'success' };
  }
}
