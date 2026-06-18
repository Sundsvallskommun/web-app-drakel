import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementWarningService from '@services/caremanagement-warning.service';
import { Body, Controller, Get, Param, Patch, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { UpdateWarningStatusDto } from '@/dtos/warning.dto';
import { WarningsApiResponse } from '@/responses/warning.response';

/** Owns the EB income warning sub-resource of an errand (list + acknowledge/close). */
@Controller()
export class WarningController {
  private warningService = new CaremanagementWarningService();

  @Get('/errands/:errandId/warnings')
  @OpenAPI({ summary: 'List the EB income warnings on an errand' })
  @ResponseSchema(WarningsApiResponse)
  @UseBefore(authMiddleware)
  async listWarnings(@Param('errandId') errandId: string) {
    const res = await this.warningService.readWarnings(errandId);
    return { data: res.data, message: 'success' };
  }

  @Patch('/errands/:errandId/warnings/:warningId')
  @OpenAPI({ summary: 'Acknowledge or close a warning on an errand' })
  @UseBefore(authMiddleware, validationMiddleware(UpdateWarningStatusDto, 'body'))
  async updateWarning(
    @Param('errandId') errandId: string,
    @Param('warningId') warningId: string,
    @Body() update: UpdateWarningStatusDto,
  ) {
    await this.warningService.updateWarningStatus(errandId, warningId, update.status);
    return { data: null, message: 'success' };
  }
}
