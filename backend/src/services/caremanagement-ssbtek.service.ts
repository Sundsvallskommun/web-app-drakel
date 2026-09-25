import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { SsbtekBasis } from '@/data-contracts/caremanagement/data-contracts';
import { SsbtekPeriodQueryDto } from '@/dtos/ssbtek.dto';
import { SsbtekPerson } from '@/responses/ssbtek.response';

/**
 * A household member's SSBTEK basis, which careM fetches live and forwards per agency. The member is named by
 * role only — careM resolves the person from the errand — and careM logs the read on the errand.
 */
class CaremanagementSsbtekService {
  private apiService = new CaremanagementApiService();

  /** Answers 404 when the errand has no household member in that role (e.g. no medsökande). */
  async readBasis(errandId: string, person: SsbtekPerson, period: SsbtekPeriodQueryDto): Promise<ApiResponse<SsbtekBasis>> {
    return this.apiService.get<SsbtekBasis>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'ssbtek'),
      params: { person, from: period.from, to: period.to },
    });
  }
}

export default CaremanagementSsbtekService;
