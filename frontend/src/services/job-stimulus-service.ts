import {
  AddJobStimulusPeriodDto,
  JobStimulusPeriod,
  JobStimulusPeriodsApiResponse,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/** A jobbstimulans period on the errand's insats, read straight from Lifecare (`id` is Lifecare's jobStimulusId). */
export type { JobStimulusPeriod };

/** Fetches the jobbstimulans periods on the errand's insats, read from Lifecare. */
export const getJobStimulusPeriods = (errandId: string): Promise<ServiceResponse<JobStimulusPeriod[]>> =>
  unwrapData(apiService.get<JobStimulusPeriodsApiResponse>(apiPath`errands/${errandId}/job-stimulus-periods`));

/**
 * Adds a jobbstimulans period for the sökande on the errand's insats in Lifecare and answers with every
 * period as Lifecare now holds them. On a refusal (`error`) `message` says why.
 */
export const addJobStimulusPeriod = (
  errandId: string,
  input: AddJobStimulusPeriodDto
): Promise<ServiceResponse<JobStimulusPeriod[]>> =>
  unwrapData(apiService.post<JobStimulusPeriodsApiResponse>(apiPath`errands/${errandId}/job-stimulus-periods`, input));
