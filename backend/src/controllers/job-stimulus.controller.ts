import authMiddleware from '@middlewares/auth.middleware';
import CaremanagementJobStimulusService from '@services/caremanagement-job-stimulus.service';
import { Controller, Get, Param, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { JobStimulusPeriodsApiResponse } from '@/responses/job-stimulus.response';

/** Serves the jobbstimulans periods (applicant and co-applicant) imported from Lifecare onto an errand. */
@Controller()
export class JobStimulusController {
  private jobStimulusService = new CaremanagementJobStimulusService();

  @Get('/errands/:errandId/job-stimulus-periods')
  @OpenAPI({ summary: 'List the jobbstimulans periods imported from Lifecare for an errand' })
  @ResponseSchema(JobStimulusPeriodsApiResponse)
  @UseBefore(authMiddleware)
  async listJobStimulusPeriods(@Param('errandId') errandId: string) {
    const res = await this.jobStimulusService.readJobStimulusPeriods(errandId);
    return { data: res.data, message: 'success' };
  }
}
