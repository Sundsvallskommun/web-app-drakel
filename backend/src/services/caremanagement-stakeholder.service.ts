import { Stakeholder } from '@/data-contracts/caremanagement/data-contracts';
import { CreateStakeholderDto } from '@/dtos/stakeholder.dto';
import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

class CaremanagementStakeholderService {
  private apiService = new CaremanagementApiService();

  async readStakeholders(errandId: string): Promise<ApiResponse<Stakeholder[]>> {
    return this.apiService.get<Stakeholder[]>({ url: caremanagementUrl('errands', errandId, 'stakeholders') });
  }

  async createStakeholder(errandId: string, stakeholder: CreateStakeholderDto): Promise<ApiResponse<void>> {
    return this.apiService.post<void>({
      url: caremanagementUrl('errands', errandId, 'stakeholders'),
      data: stakeholder,
    });
  }
}

export default CaremanagementStakeholderService;
