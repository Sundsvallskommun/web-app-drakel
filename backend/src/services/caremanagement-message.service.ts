import { ApiResponse } from '@interfaces/api-service.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { AttachmentFile, fileNameFromDisposition, UploadedFileLike } from '@services/caremanagement-attachment.service';
import { caremanagementUrl } from '@utils/caremanagement-url';
import axios from 'axios';
import FormData from 'form-data';

import { HttpException } from '@/exceptions/HttpException';
import { Message } from '@/responses/message.response';

/**
 * Payload sent to caremanagement when posting a message. Unlike the handläggare-facing DTO this
 * carries the full shape — `direction` and `author` are decided server-side in the controller.
 */
interface CaremanagementMessage {
  direction: 'INBOUND' | 'OUTBOUND';
  body: string;
  author?: string;
}

class CaremanagementMessageService {
  private apiService = new CaremanagementApiService();

  /** Lists an errand's conversation messages (caremanagement returns them chronologically). */
  async listMessages(errandId: string): Promise<ApiResponse<Message[]>> {
    return this.apiService.get<Message[]>({ url: caremanagementUrl('errands', errandId, 'messages') });
  }

  /**
   * Posts a message (with optional file attachments) to the errand's conversation. caremanagement
   * takes a multipart request: a JSON `message` part plus zero or more `attachments` file parts. It
   * replies 201 with an empty body; the caller refetches the list, so we resolve to null.
   */
  async createMessage(errandId: string, message: CaremanagementMessage, files: UploadedFileLike[] = []): Promise<ApiResponse<null>> {
    const form = new FormData();
    form.append('message', JSON.stringify(message), { contentType: 'application/json' });
    for (const file of files) {
      form.append('attachments', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    }
    const url = caremanagementUrl('errands', errandId, 'messages');
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

  /** Streams a single message attachment's binary contents (caremanagement returns the raw file). */
  async streamMessageAttachmentFile(errandId: string, messageId: string, attachmentId: string): Promise<AttachmentFile> {
    const url = caremanagementUrl('errands', errandId, 'messages', messageId, 'attachments', attachmentId, 'file');
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
}

export default CaremanagementMessageService;
