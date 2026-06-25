import { ApiResponse } from '@interfaces/api-service.interface';
import ApiService from '@services/api.service';

import {
  MESSAGING_DEPARTMENT,
  MESSAGING_ORGANIZATION_NUMBER,
  MESSAGING_SUPPORT_EMAIL,
  MESSAGING_SUPPORT_PHONE,
  MESSAGING_SUPPORT_TEXT,
  MESSAGING_SUPPORT_URL,
  MUNICIPALITY_ID,
} from '@/config';
import { getApiBase } from '@/config/api-config';
import {
  DigitalMailAttachmentContentTypeEnum,
  DigitalMailRequest,
  DigitalMailRequestContentTypeEnum,
  LetterAttachmentContentTypeEnum,
  LetterAttachmentDeliveryModeEnum,
  LetterRequest,
  LetterRequestContentTypeEnum,
  Mailbox,
} from '@/data-contracts/messaging/data-contracts';

const PDF_FILENAME = 'beslut.pdf';

/**
 * Sends the beslut to the applicant through the Messaging service: Mina sidor (web message), digital
 * brevlåda (digital mail) and brev (letter/snail mail), and checks whether a person has a digital mailbox.
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

  /** Whether the party has a reachable digital mailbox (so the "Digital brevlåda" channel is offered). */
  async hasDigitalMailbox(partyId: string): Promise<boolean> {
    const url = `${this.base()}/${MESSAGING_ORGANIZATION_NUMBER}/mailboxes`;
    const res: ApiResponse<Mailbox[]> = await this.apiService.post<Mailbox[]>({ url, data: [partyId] });
    return (res.data ?? []).some((mailbox) => mailbox.partyId === partyId && mailbox.reachable === true);
  }

  /** Digital brevlåda — a digital mail with the beslut PDF attached. */
  async sendDigitalMail(partyId: string, subject: string, body: string, pdfBase64: string): Promise<void> {
    const request: DigitalMailRequest = {
      party: { partyIds: [partyId] },
      sender: { supportInfo: this.supportInfo() },
      subject,
      department: MESSAGING_DEPARTMENT,
      contentType: DigitalMailRequestContentTypeEnum.TextPlain,
      body,
      attachments: [
        { content: pdfBase64, filename: PDF_FILENAME, contentType: DigitalMailAttachmentContentTypeEnum.ApplicationPdf },
      ],
    };
    await this.apiService.post({ url: `${this.base()}/digital-mail`, data: request });
  }

  /** Brev — a physical letter (snail mail) with the beslut PDF attached. */
  async sendLetter(partyId: string, subject: string, body: string, pdfBase64: string): Promise<void> {
    const request: LetterRequest = {
      party: { partyIds: [partyId] },
      subject,
      sender: { supportInfo: this.supportInfo() },
      contentType: LetterRequestContentTypeEnum.TextPlain,
      body,
      department: MESSAGING_DEPARTMENT,
      attachments: [
        {
          deliveryMode: LetterAttachmentDeliveryModeEnum.SNAIL_MAIL,
          filename: PDF_FILENAME,
          contentType: LetterAttachmentContentTypeEnum.ApplicationPdf,
          content: pdfBase64,
        },
      ],
    };
    await this.apiService.post({ url: `${this.base()}/letter`, data: request });
  }
}

export default MessagingService;
