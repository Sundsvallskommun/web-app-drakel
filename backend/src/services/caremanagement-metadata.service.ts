import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { Lookup, ReadLookupsParamsKindEnum } from '@/data-contracts/caremanagement/data-contracts';

class CaremanagementMetadataService {
  private apiService = new CaremanagementApiService();

  /**
   * Reads metadata lookups of a given kind (CATEGORY, STATUS, TYPE, ROLE, CONTACT_REASON).
   */
  async readLookups(kind: ReadLookupsParamsKindEnum): Promise<ApiResponse<Lookup[]>> {
    return this.apiService.get<Lookup[]>({ url: caremanagementUrl('metadata'), params: { kind } });
  }
}

export default CaremanagementMetadataService;
