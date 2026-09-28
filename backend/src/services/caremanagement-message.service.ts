import { ApiResponse } from '@interfaces/api-service.interface';
import { AttachmentFile, UploadedFileLike } from '@interfaces/file.interface';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementUrl } from '@utils/caremanagement-url';
import FormData from 'form-data';

import { CreateMessage, Message, UnreadCount } from '@/data-contracts/caremanagement/data-contracts';

class CaremanagementMessageService {
  private apiService = new CaremanagementApiService();

  /** Lists an errand's conversation messages (caremanagement returns them chronologically). */
  async listMessages(errandId: string): Promise<ApiResponse<Message[]>> {
    return this.apiService.get<Message[]>({ url: caremanagementUrl('errands', errandId, 'messages') });
  }

  /** The number of messages addressed to the caller that haven't been marked read (the unread count). */
  async readUnreadCount(errandId: string): Promise<ApiResponse<UnreadCount>> {
    return this.apiService.get<UnreadCount>({ url: caremanagementUrl('errands', errandId, 'messages', 'unread-count') });
  }

  /**
   * Posts a message (with optional file attachments) to the errand's conversation. caremanagement
   * takes a multipart request: a JSON `message` part plus zero or more `attachments` file parts. It
   * replies 201 with an empty body; the caller refetches the list, so we resolve to null. The message's
   * `direction` and `author` are decided by the caller, never taken from the client.
   */
  async createMessage(errandId: string, message: CreateMessage, files: UploadedFileLike[] = []): Promise<ApiResponse<null>> {
    const form = new FormData();
    form.append('message', JSON.stringify(message), { contentType: 'application/json' });
    for (const file of files) {
      form.append('attachments', file.buffer, { filename: file.originalname, contentType: file.mimetype });
    }
    await this.apiService.postMultipart({ url: caremanagementUrl('errands', errandId, 'messages'), form });
    return { data: null, message: 'success' };
  }

  /** Reads a single message attachment's binary contents (caremanagement returns the raw file). */
  async streamMessageAttachmentFile(errandId: string, messageId: string, attachmentId: string): Promise<AttachmentFile> {
    return this.apiService.getFile(caremanagementUrl('errands', errandId, 'messages', messageId, 'attachments', attachmentId, 'file'));
  }
}

export default CaremanagementMessageService;
