import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import ErrandLifecareJobStimulusService from '@services/errand-lifecare-job-stimulus.service';
import { Body, Controller, Get, HttpCode, Param, Post, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { AddJobStimulusPeriodDto } from '@/dtos/job-stimulus.dto';
import { JobStimulusPeriodsApiResponse } from '@/responses/job-stimulus.response';

/** The jobbstimulans periods (sökande and medsökande) of an errand, read from and written to Lifecare. */
@Controller()
export class JobStimulusController {
  private jobStimulusService = new ErrandLifecareJobStimulusService();

  @Get('/errands/:errandId/job-stimulus-periods')
  @OpenAPI({ summary: "The jobbstimulans periods on the errand's insats, read from Lifecare" })
  @ResponseSchema(JobStimulusPeriodsApiResponse)
  @UseBefore(authMiddleware)
  async listJobStimulusPeriods(@Param('errandId') errandId: string) {
    return { data: await this.jobStimulusService.periods(errandId), message: 'success' };
  }

  @Post('/errands/:errandId/job-stimulus-periods')
  @HttpCode(201)
  @OpenAPI({ summary: "Add a jobbstimulans period for the sökande on the errand's insats in Lifecare; answers with every period" })
  @ResponseSchema(JobStimulusPeriodsApiResponse)
  @UseBefore(authMiddleware, validationMiddleware(AddJobStimulusPeriodDto, 'body'))
  async addJobStimulusPeriod(@Param('errandId') errandId: string, @Body() input: AddJobStimulusPeriodDto) {
    return { data: await this.jobStimulusService.addPeriod(errandId, input), message: 'success' };
  }
}
