import { AddJobStimulusPeriodDto } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * A jobbstimulans period on the errand's insats, read straight from Lifecare. Mirrors the backend
 * response, with the role narrowed to the two parties it can belong to.
 */
export interface JobStimulusPeriod {
  /** Lifecare's jobStimulusId. */
  id?: number;
  role?: 'APPLICANT' | 'CO_APPLICANT';
  /** Period start (yyyy-MM-dd). */
  fromDate?: string;
  /** Period end (yyyy-MM-dd); absent for an open-ended period. */
  toDate?: string;
}

/** Fetches the jobbstimulans periods on the errand's insats, read from Lifecare. */
export const getJobStimulusPeriods = (errandId: string): Promise<ServiceResponse<JobStimulusPeriod[]>> =>
  apiService
    .get<ApiResponse<JobStimulusPeriod[]>>(`errands/${errandId}/job-stimulus-periods`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/**
 * Adds a jobbstimulans period for the sökande on the errand's insats in Lifecare and answers with every
 * period as Lifecare now holds them. On a refusal (`error`) `message` says why.
 */
export const addJobStimulusPeriod = (
  errandId: string,
  input: AddJobStimulusPeriodDto
): Promise<ServiceResponse<JobStimulusPeriod[]>> =>
  apiService
    .post<ApiResponse<JobStimulusPeriod[]>>(`errands/${errandId}/job-stimulus-periods`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
