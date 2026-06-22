import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementBevakningService from '@services/caremanagement-bevakning.service';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { MonitoringRequest } from '@/data-contracts/caremanagement/data-contracts';
import { BevakningInputDto } from '@/dtos/bevakning.dto';
import { BevakningApiResponse, BevakningarApiResponse } from '@/responses/bevakning.response';

/** Owns the bevakning (date-bound watch/reminder) sub-resource of a financial-assistance errand. */
@Controller()
export class BevakningController {
  private bevakningService = new CaremanagementBevakningService();

  @Get('/errands/:errandId/bevakningar')
  @OpenAPI({ summary: 'List the bevakningar on an errand' })
  @ResponseSchema(BevakningarApiResponse)
  @UseBefore(authMiddleware)
  async listBevakningar(@Param('errandId') errandId: string) {
    const res = await this.bevakningService.readBevakningar(errandId);
    return { data: res.data, message: 'success' };
  }

  @Post('/errands/:errandId/bevakningar')
  @HttpCode(201)
  @OpenAPI({ summary: 'Create a bevakning on an errand' })
  @ResponseSchema(BevakningApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(BevakningInputDto, 'body'))
  async createBevakning(@Req() req: RequestWithUser, @Param('errandId') errandId: string, @Body() input: BevakningInputDto) {
    const body: MonitoringRequest = {
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      createdBy: req.user.username,
    };
    const res = await this.bevakningService.createBevakning(errandId, body);
    return { data: res.data, message: 'success' };
  }

  @Put('/errands/:errandId/bevakningar/:bevakningId')
  @OpenAPI({ summary: 'Replace a bevakning on an errand' })
  @ResponseSchema(BevakningApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(BevakningInputDto, 'body'))
  async updateBevakning(
    @Req() req: RequestWithUser,
    @Param('errandId') errandId: string,
    @Param('bevakningId') bevakningId: string,
    @Body() input: BevakningInputDto,
  ) {
    const body: MonitoringRequest = {
      title: input.title,
      description: input.description,
      startDate: input.startDate,
      endDate: input.endDate,
      createdBy: req.user.username,
    };
    const res = await this.bevakningService.updateBevakning(errandId, bevakningId, body);
    return { data: res.data, message: 'success' };
  }

  @Delete('/errands/:errandId/bevakningar/:bevakningId')
  @OpenAPI({ summary: 'Delete a bevakning on an errand' })
  @UseBefore(authMiddleware)
  async deleteBevakning(@Param('errandId') errandId: string, @Param('bevakningId') bevakningId: string) {
    await this.bevakningService.deleteBevakning(errandId, bevakningId);
    return { data: null, message: 'success' };
  }
}
