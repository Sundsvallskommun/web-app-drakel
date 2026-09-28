import { ApiResponse } from '@interfaces/api-service.interface';
import { AttachmentFile, UploadedFileLike } from '@interfaces/file.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';
import FormData from 'form-data';

import { Attachment } from '@/data-contracts/caremanagement/data-contracts';

class CaremanagementAttachmentService {
  private apiService = new CaremanagementApiService();

  async readAttachments(errandId: string): Promise<ApiResponse<Attachment[]>> {
    return this.apiService.get<Attachment[]>({ url: caremanagementUrl('errands', errandId, 'attachments') });
  }

  /** Reads a single attachment's binary contents (caremanagement returns the raw file). */
  async streamAttachmentFile(errandId: string, attachmentId: string): Promise<AttachmentFile> {
    return this.apiService.getFile(caremanagementUrl('errands', errandId, 'attachments', attachmentId, 'file'));
  }

  /**
   * Uploads a file as a new attachment via multipart/form-data. `documentType` (e.g. DECISION) is sent as
   * the query param caremanagement uses to categorise the attachment; omitted, caremanagement applies its
   * default.
   */
  async createAttachment(errandId: string, file: UploadedFileLike, documentType?: string): Promise<ApiResponse<null>> {
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    await this.apiService.postMultipart({
      url: caremanagementUrl('errands', errandId, 'attachments'),
      form,
      params: documentType ? { documentType } : undefined,
    });
    return { data: null, message: 'success' };
  }
}

export default CaremanagementAttachmentService;
