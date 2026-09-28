import { UploadedFileLike } from '@services/caremanagement-attachment.service';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import MessagingService from '@services/messaging.service';

import { FinalizeErrandDto } from '@/dtos/finalize.dto';

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

  private async resolveApplicantPartyId(errandId: string): Promise<string | undefined> {
    const stakeholders = await this.stakeholderService.readStakeholders(errandId);
    return (stakeholders.data ?? []).find(stakeholder => stakeholder.role === 'APPLICANT')?.externalId;
  }

  /**
   * Sends the handläggare's message, with the documents they chose, through the selected channels and resolves with
   * the labels of the ones that failed. Each channel is sent independently so one failing channel does not abort the
   * others, and every channel gets the same PDFs.
   */
  async send(errandId: string, input: FinalizeErrandDto, author: string, attachments: UploadedFileLike[]): Promise<string[]> {
    const pdfs = attachments.map(file => ({ filename: file.originalname, content: file.buffer.toString('base64') }));
    const body = input.message;

    // The applicant's partyId is only needed by the brev channel; the meddelande goes into the errand's own
    // conversation, which doesn't need it.
    const partyId = (await this.resolveApplicantPartyId(errandId)) ?? '';

    const allChannels: Channel[] = [
      {
        selected: !!input.meddelande,
        label: 'Meddelande',
        send: async () => {
          await this.messageService.createMessage(errandId, { direction: 'OUTBOUND', body, author }, attachments);
        },
      },
      {
        selected: !!input.brev,
        label: 'Brev',
        send: () => this.messagingService.sendLetter(partyId, DECISION_SUBJECT, body, pdfs),
      },
    ];

    const failedChannels: string[] = [];
    await Promise.all(
      allChannels
        .filter(channel => channel.selected)
        .map(async channel => {
          try {
            await channel.send();
          } catch {
            failedChannels.push(channel.label);
          }
        }),
    );
    return failedChannels;
  }
}

export default DecisionNotificationService;
