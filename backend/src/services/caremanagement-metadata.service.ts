import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { FinancialAssistanceMetadata, Lookup, ReadLookupsParamsKindEnum } from '@/data-contracts/caremanagement/data-contracts';

class CaremanagementMetadataService {
  private apiService = new CaremanagementApiService();

  /**
   * Reads metadata lookups of a given kind (CATEGORY, STATUS, TYPE, ROLE, CONTACT_REASON).
   */
  async readLookups(kind: ReadLookupsParamsKindEnum): Promise<ApiResponse<Lookup[]>> {
    return this.apiService.get<Lookup[]>({ url: caremanagementUrl('metadata'), params: { kind } });
  }

  /**
   * The financial-assistance type catalogues behind the frontend dropdowns: income and cost types for
   * the normberäkning, money types and payment methods for the utbetalning. One endpoint serves them all.
   */
  async readFinancialAssistanceMetadata(): Promise<ApiResponse<FinancialAssistanceMetadata>> {
    return this.apiService.get<FinancialAssistanceMetadata>({
      url: caremanagementUrl('errands', 'financial-assistance', 'metadata'),
    });
  }
}

export default CaremanagementMetadataService;
