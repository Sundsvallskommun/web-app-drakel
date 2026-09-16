import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * A jobbstimulans period on an errand, imported from Lifecare. Defined locally mirroring the backend
 * response. The set is replaced on every Lifecare import, so periods have no stable id.
 */
export interface JobStimulusPeriod {
  role?: 'APPLICANT' | 'CO_APPLICANT';
  /** Period start (yyyy-MM-dd). */
  fromDate?: string;
  /** Period end (yyyy-MM-dd); absent for an open-ended period. */
  toDate?: string;
}

/** Fetches the jobbstimulans periods imported from Lifecare for an errand. */
export const getJobStimulusPeriods = (errandId: string): Promise<ServiceResponse<JobStimulusPeriod[]>> =>
  apiService
    .get<ApiResponse<JobStimulusPeriod[]>>(`errands/${errandId}/job-stimulus-periods`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
