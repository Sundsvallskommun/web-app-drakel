import { ApiResponse } from '@interfaces/api-service.interface';
import { AttachmentFile } from '@interfaces/file.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementFinancialAssistanceUrl } from '@utils/caremanagement-url';
import FormData from 'form-data';

import { Actualisation, ArchiveActualisationRequest } from '@/data-contracts/caremanagement/data-contracts';

/**
 * Reads/writes the Lifecare aktualiseringar (case intake) of the EB process. Used by the handläggare to
 * pick an existing aktualisering for a supplementary application and archive a document onto it — which
 * also stamps the chosen aktualisering onto the errand (caremanagement records it as a Decision).
 */
class CaremanagementActualisationService {
  private apiService = new CaremanagementApiService();

  /** Lists an applicant's Lifecare aktualiseringar (date range defaults server-side to the last 24 months). */
  async listActualisations(partyId: string): Promise<ApiResponse<Actualisation[]>> {
    return this.apiService.get<Actualisation[]>({
      url: caremanagementFinancialAssistanceUrl('actualisations'),
      params: { partyId },
    });
  }

  /**
   * Archives a document onto a chosen aktualisering — multipart with the binary `file` part and a JSON
   * `request` part. caremanagement returns 204; `request.errandId` makes it stamp the aktualisering onto
   * that errand. `partyId` is the applicant whose ownership of the aktualisering caremanagement verifies.
   */
  async archive(actualisationId: string, partyId: string, file: AttachmentFile, request: ArchiveActualisationRequest): Promise<ApiResponse<null>> {
    const form = new FormData();
    form.append('file', file.data, {
      filename: file.fileName ?? 'document.pdf',
      contentType: file.contentType ?? 'application/pdf',
    });
    form.append('request', JSON.stringify(request), { contentType: 'application/json' });
    await this.apiService.postMultipart({
      url: caremanagementFinancialAssistanceUrl('actualisations', actualisationId, 'archive'),
      form,
      params: { partyId },
    });
    return { data: null, message: 'success' };
  }
}

export default CaremanagementActualisationService;
