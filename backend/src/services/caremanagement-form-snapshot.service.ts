import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { FormSnapshot } from '@/data-contracts/caremanagement/data-contracts';

/**
 * Reads the immutable form snapshot of a financial-assistance errand — the self-describing capture of the
 * application form exactly as the applicant saw and answered it (sections → fields → options/answers).
 * Captured write-once when the application is submitted; caremanagement 404s when none was captured.
 */
class CaremanagementFormSnapshotService {
  private apiService = new CaremanagementApiService();

  async readFormSnapshot(errandId: string): Promise<ApiResponse<FormSnapshot>> {
    return this.apiService.get<FormSnapshot>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'form-snapshot'),
    });
  }
}

export default CaremanagementFormSnapshotService;
