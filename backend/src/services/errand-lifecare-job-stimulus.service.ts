import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';

import { LifecareJobStimulusPeriod, LifecareJobStimulusPeriodRequest } from '@/data-contracts/caremanagement/data-contracts';
import { AddJobStimulusPeriodDto } from '@/dtos/job-stimulus.dto';
import { JobStimulusPeriod } from '@/responses/job-stimulus.response';

const jobStimulusUrl = (errandId: string): string => caremanagementLifecareUrl(errandId, 'job-stimulus-periods');

/**
 * The jobbstimulans periods of an errand's sökande and medsökande, kept on the insats in Lifecare — the register of
 * record — and read and written through careM, which logs every access on the errand.
 */
class ErrandLifecareJobStimulusService {
  private apiService = new CaremanagementApiService();

  async periods(errandId: string): Promise<JobStimulusPeriod[]> {
    const response = await this.apiService.get<LifecareJobStimulusPeriod[]>({ url: jobStimulusUrl(errandId) });
    return response.data;
  }

  /**
   * Adds a jobbstimulans period for the sökande; its end is Lifecare's two-year rule unless the handläggare set one.
   * careM refuses (422) a household with a medsökande. Answers with every period after the save.
   */
  async addPeriod(errandId: string, input: AddJobStimulusPeriodDto): Promise<JobStimulusPeriod[]> {
    const request: LifecareJobStimulusPeriodRequest = { fromDate: input.fromDate, toDate: input.toDate };
    const response = await this.apiService.post<LifecareJobStimulusPeriod[]>({ url: jobStimulusUrl(errandId), data: request });
    return response.data;
  }
}

export default ErrandLifecareJobStimulusService;
