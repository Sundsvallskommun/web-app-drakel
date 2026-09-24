import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { SsbtekBasis } from '@/data-contracts/caremanagement/data-contracts';
import { SsbtekQueryDto } from '@/dtos/ssbtek.dto';

/** The errand's SSBTEK basis, which careM fetches live and forwards per agency. careM logs the read on the errand. */
class CaremanagementSsbtekService {
  private apiService = new CaremanagementApiService();

  async readBasis(errandId: string, query: SsbtekQueryDto): Promise<ApiResponse<SsbtekBasis>> {
    return this.apiService.get<SsbtekBasis>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'ssbtek'),
      params: query,
    });
  }
}

export default CaremanagementSsbtekService;
