import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { AttachmentFile } from '@services/caremanagement-attachment.service';
import { caremanagementError } from '@utils/caremanagement-error';
import { caremanagementUrl } from '@utils/caremanagement-url';
import { sentByHeaders } from '@utils/request-context';
import axios from 'axios';
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
      url: caremanagementUrl('errands', 'financial-assistance', 'actualisations'),
      params: { partyId },
    });
  }

  /**
   * Archives a document onto a chosen aktualisering — multipart with the binary `file` part and a JSON
   * `request` part. caremanagement returns 204; `request.errandId` makes it stamp the aktualisering onto
   * that errand.
   */
  async archive(
    actualisationId: string,
    file: AttachmentFile,
    request: ArchiveActualisationRequest
  ): Promise<ApiResponse<null>> {
    const form = new FormData();
    form.append('file', file.data, {
      filename: file.fileName ?? 'document.pdf',
      contentType: file.contentType ?? 'application/pdf',
    });
    form.append('request', JSON.stringify(request), { contentType: 'application/json' });
    const url = caremanagementUrl('errands', 'financial-assistance', 'actualisations', actualisationId, 'archive');
    try {
      await axios.post(url, form, { headers: { ...form.getHeaders(), ...sentByHeaders() } });
      return { data: null, message: 'success' };
    } catch (error) {
      throw caremanagementError(error);
    }
  }
}

export default CaremanagementActualisationService;
