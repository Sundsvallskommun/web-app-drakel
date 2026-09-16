import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { JobStimulusPeriod } from '@/data-contracts/caremanagement/data-contracts';

/**
 * Reads the jobbstimulans periods of a financial-assistance errand — mirrored out of Lifecare by the RPA
 * supplements ingest, which replaces the whole set on every delivery (so periods carry no stable id).
 */
class CaremanagementJobStimulusService {
  private apiService = new CaremanagementApiService();

  async readJobStimulusPeriods(errandId: string): Promise<ApiResponse<JobStimulusPeriod[]>> {
    return this.apiService.get<JobStimulusPeriod[]>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'job-stimulus-periods'),
    });
  }
}

export default CaremanagementJobStimulusService;
