import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementError } from '@utils/caremanagement-error';
import { caremanagementUrl } from '@utils/caremanagement-url';
import { sentByHeaders } from '@utils/request-context';
import axios from 'axios';
import FormData from 'form-data';

import { Attachment } from '@/data-contracts/caremanagement/data-contracts';

/** @public */
export interface AttachmentFile {
  data: Buffer;
  contentType?: string;
  fileName?: string;
}

/** Minimal shape of a multer-uploaded file (avoids depending on @types/multer). */
export interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export const fileNameFromDisposition = (disposition?: string): string | undefined => {
  if (!disposition) {
    return undefined;
  }
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const captured = match?.[1];
  return captured === undefined ? undefined : decodeURIComponent(captured);
};

class CaremanagementAttachmentService {
  private apiService = new CaremanagementApiService();

  async readAttachments(errandId: string): Promise<ApiResponse<Attachment[]>> {
    return this.apiService.get<Attachment[]>({ url: caremanagementUrl('errands', errandId, 'attachments') });
  }

  /** Streams a single attachment's binary contents (caremanagement returns the raw file). */
  async streamAttachmentFile(errandId: string, attachmentId: string): Promise<AttachmentFile> {
    const url = caremanagementUrl('errands', errandId, 'attachments', attachmentId, 'file');
    try {
      const res = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer', headers: sentByHeaders() });
      const headers = res.headers as Record<string, string | undefined>;
      return {
        data: Buffer.from(res.data),
        contentType: headers['content-type'],
        fileName: fileNameFromDisposition(headers['content-disposition']),
      };
    } catch (error) {
      throw caremanagementError(error);
    }
  }

  /** Uploads a file as a new attachment via multipart/form-data. */
  async createAttachment(errandId: string, file: UploadedFileLike): Promise<ApiResponse<null>> {
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    const url = caremanagementUrl('errands', errandId, 'attachments');
    try {
      await axios.post(url, form, { headers: { ...form.getHeaders(), ...sentByHeaders() } });
      return { data: null, message: 'success' };
    } catch (error) {
      throw caremanagementError(error);
    }
  }
}

export default CaremanagementAttachmentService;
