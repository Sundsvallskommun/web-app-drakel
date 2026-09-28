import { UploadedFileLike } from '@interfaces/file.interface';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import MessagingService from '@services/messaging.service';
import { httpStatusOf } from '@utils/http-error-status';
import { logger } from '@utils/logger';

import { CreateMessageDirectionEnum } from '@/data-contracts/caremanagement/data-contracts';
import { FinalizeErrandDto } from '@/dtos/finalize.dto';
import { HttpException } from '@/exceptions/HttpException';

const DECISION_SUBJECT = 'Beslut om ekonomiskt bistånd';

interface Channel {
  selected: boolean;
  label: string;
  send: () => Promise<void>;
}

/**
 * Sends the beslut to the applicant through the chosen channels: meddelande (a message in the errand's conversation)
 * and brev (a letter through Messaging). Mina sidor (a party asset) is recorded in caremanagement but not sent yet.
 * caremanagement records which channels were chosen but sends nothing itself — this is the BFF's job. The documents
 * are fetched before the errand is finalized (see DecisionDocumentsService) and handed in here.
 */
class DecisionNotificationService {
  private stakeholderService = new CaremanagementStakeholderService();
  private messageService = new CaremanagementMessageService();
  private messagingService = new MessagingService();

  /**
   * Sends the handläggare's message, with the documents they chose, through the selected channels and resolves with
   * the labels of the ones that failed. Each channel is sent independently so one failing channel does not abort the
   * others, and every channel gets the same PDFs. A failed channel is logged by errand, channel and status only.
   */
  async send(errandId: string, input: FinalizeErrandDto, author: string, attachments: UploadedFileLike[]): Promise<string[]> {
    const pdfs = attachments.map(file => ({ filename: file.originalname, content: file.buffer.toString('base64') }));
    const body = input.message;

    const allChannels: Channel[] = [
      {
        selected: !!input.meddelande,
        label: 'Meddelande',
        send: async () => {
          await this.messageService.createMessage(errandId, { direction: CreateMessageDirectionEnum.OUTBOUND, body, author }, attachments);
        },
      },
      {
        selected: !!input.brev,
        label: 'Brev',
        send: async () => {
          await this.messagingService.sendLetter(await this.applicantPartyId(errandId), DECISION_SUBJECT, body, pdfs);
        },
      },
    ];

    const failedChannels: string[] = [];
    await Promise.all(
      allChannels
        .filter(channel => channel.selected)
        .map(async channel => {
          try {
            await channel.send();
          } catch (error) {
            logger.warn(`Could not send the beslut on errand ${errandId} as ${channel.label} (status ${httpStatusOf(error) ?? 'unknown'})`);
            failedChannels.push(channel.label);
          }
        }),
    );
    return failedChannels;
  }

  /**
   * The sökande's partyId, which only the brev needs — the meddelande goes into the errand's own conversation. Read
   * inside the brev's send, so a failing lookup fails the brev alone.
   */
  private async applicantPartyId(errandId: string): Promise<string> {
    const partyId = await this.stakeholderService.readApplicantPartyId(errandId);
    if (!partyId) {
      throw new HttpException(404, 'The errand has no sökande with a partyId to send a brev to');
    }
    return partyId;
  }
}

export default DecisionNotificationService;
