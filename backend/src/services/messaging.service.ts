import ApiService from '@services/api.service';

import {
  MESSAGING_DEPARTMENT,
  MESSAGING_SUPPORT_EMAIL,
  MESSAGING_SUPPORT_PHONE,
  MESSAGING_SUPPORT_TEXT,
  MESSAGING_SUPPORT_URL,
  MUNICIPALITY_ID,
} from '@/config';
import { getApiBase } from '@/config/api-config';
import {
  LetterAttachmentContentTypeEnum,
  LetterAttachmentDeliveryModeEnum,
  LetterRequest,
  LetterRequestContentTypeEnum,
} from '@/data-contracts/messaging/data-contracts';

/** A PDF enclosed in a letter. */
interface MessagingPdf {
  filename: string;
  /** The PDF, base64-encoded. */
  content: string;
}

/**
 * Sends the beslut to the applicant as a brev (letter/snail mail) through the Messaging service.
 * Reached through the API gateway (bearer token via {@link ApiService}). Sender/department/support config
 * comes from the environment.
 */
class MessagingService {
  private apiService = new ApiService();

  private base(): string {
    return `${getApiBase('messaging')}/${MUNICIPALITY_ID}`;
  }

  private supportInfo() {
    return {
      text: MESSAGING_SUPPORT_TEXT,
      emailAddress: MESSAGING_SUPPORT_EMAIL || undefined,
      phoneNumber: MESSAGING_SUPPORT_PHONE || undefined,
      url: MESSAGING_SUPPORT_URL || undefined,
    };
  }

  /** Brev — a physical letter (snail mail) with the PDFs enclosed. The body is HTML, as the editor wrote it. */
  async sendLetter(partyId: string, subject: string, body: string, pdfs: MessagingPdf[]): Promise<void> {
    const request: LetterRequest = {
      party: { partyIds: [partyId] },
      subject,
      sender: { supportInfo: this.supportInfo() },
      contentType: LetterRequestContentTypeEnum.TextHtml,
      body,
      department: MESSAGING_DEPARTMENT,
      attachments: pdfs.map(pdf => ({
        ...pdf,
        deliveryMode: LetterAttachmentDeliveryModeEnum.SNAIL_MAIL,
        contentType: LetterAttachmentContentTypeEnum.ApplicationPdf,
      })),
    };
    await this.apiService.post({ url: `${this.base()}/letter`, data: request });
  }
}

export default MessagingService;
