import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';

import { SectionApproval, SectionApprovalRequest, SectionApprovals } from '@/data-contracts/caremanagement/data-contracts';

/** Owns the handläggare approval state of the three EB view sections (calculation / payment / decision). */
class CaremanagementSectionApprovalService {
  private apiService = new CaremanagementApiService();

  async readApprovals(errandId: string): Promise<ApiResponse<SectionApprovals>> {
    return this.apiService.get<SectionApprovals>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'sections', 'approvals'),
    });
  }

  async setApproval(
    errandId: string,
    section: string,
    body: SectionApprovalRequest,
  ): Promise<ApiResponse<SectionApproval>> {
    return this.apiService.patch<SectionApproval>({
      url: caremanagementUrl('errands', 'financial-assistance', errandId, 'sections', section, 'approval'),
      data: body,
    });
  }
}

export default CaremanagementSectionApprovalService;
