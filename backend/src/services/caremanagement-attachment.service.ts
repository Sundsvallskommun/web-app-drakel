import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';
import axios from 'axios';
import FormData from 'form-data';

import { Attachment } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

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

const fileNameFromDisposition = (disposition?: string): string | undefined => {
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
      const res = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
      const headers = res.headers as Record<string, string | undefined>;
      return {
        data: Buffer.from(res.data),
        contentType: headers['content-type'],
        fileName: fileNameFromDisposition(headers['content-disposition']),
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new HttpException(404, 'Not found');
      }
      throw new HttpException(500, 'Internal server error from caremanagement');
    }
  }

  /** Uploads a file as a new attachment via multipart/form-data. */
  async createAttachment(errandId: string, file: UploadedFileLike): Promise<ApiResponse<null>> {
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    const url = caremanagementUrl('errands', errandId, 'attachments');
    try {
      await axios.post(url, form, { headers: form.getHeaders() });
      return { data: null, message: 'success' };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new HttpException(404, 'Not found');
      }
      throw new HttpException(500, 'Internal server error from caremanagement');
    }
  }
}

export default CaremanagementAttachmentService;
