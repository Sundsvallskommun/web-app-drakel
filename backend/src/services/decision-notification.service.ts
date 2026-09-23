import CaremanagementAttachmentService from '@services/caremanagement-attachment.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import MessagingService from '@services/messaging.service';

import { DecisionNotificationDto } from '@/dtos/decision-notification.dto';

const DECISION_DOCUMENT_TYPE = 'DECISION';
const DECISION_SUBJECT = 'Beslut om ekonomiskt bistånd';
// Short cover text; the actual beslut is the attached PDF.
const DECISION_BODY = 'Du har fått ett beslut om ekonomiskt bistånd. Beslutet finns i den bifogade filen.';

interface Channel {
  selected: boolean;
  label: string;
  send: () => Promise<void>;
}

/**
 * Sends a beslut to the applicant: takes Lifecare's own print of the beslut as PDF, saves it on the errand as a
 * DECISION attachment and sends it through the chosen Messaging channels (Mina sidor / digital brevlåda /
 * brev). caremanagement records which channels were chosen but sends nothing itself — this is the BFF's job.
 */
class DecisionNotificationService {
  private lifecareDecision = new ErrandLifecareDecisionService();
  private errandService = new CaremanagementErrandService();
  private attachmentService = new CaremanagementAttachmentService();
  private stakeholderService = new CaremanagementStakeholderService();
  private messageService = new CaremanagementMessageService();
  private messagingService = new MessagingService();

  private async resolveApplicantPartyId(errandId: string): Promise<string | undefined> {
    const stakeholders = await this.stakeholderService.readStakeholders(errandId);
    return (stakeholders.data ?? []).find(stakeholder => stakeholder.role === 'APPLICANT')?.externalId;
  }

  /** Whether the applicant has a reachable digital mailbox (false when there is no applicant to ask about). */
  async hasDigitalMailbox(errandId: string): Promise<boolean> {
    const partyId = await this.resolveApplicantPartyId(errandId);
    return partyId ? this.messagingService.hasDigitalMailbox(partyId) : false;
  }

  /**
   * Sends the latest saved beslut through the selected channels and resolves with the labels of the ones that
   * failed. Each channel is sent independently so one failing channel does not abort the others.
   */
  async send(errandId: string, channels: DecisionNotificationDto, author: string): Promise<string[]> {
    const pdf = await this.lifecareDecision.pdf(errandId);
    const pdfBase64 = pdf.toString('base64');

    // Save the rendered PDF on the errand as the DECISION attachment, named beslut-<ärendenummer>.pdf.
    const errand = await this.errandService.getErrand(errandId);
    const filename = `beslut-${errand.data?.errandNumber ?? errandId}.pdf`;
    const pdfFile = { buffer: pdf, originalname: filename, mimetype: 'application/pdf' };
    await this.attachmentService.createAttachment(errandId, pdfFile, DECISION_DOCUMENT_TYPE);

    // The applicant's partyId is only needed by the digital brevlåda / brev channels; Mina sidor goes
    // through the errand's e-service conversation, which doesn't need it.
    const partyId = (await this.resolveApplicantPartyId(errandId)) ?? '';

    const allChannels: Channel[] = [
      {
        selected: !!channels.minaSidor,
        label: 'Mina sidor',
        send: async () => {
          await this.messageService.createMessage(errandId, { direction: 'OUTBOUND', body: DECISION_BODY, author }, [pdfFile]);
        },
      },
      {
        selected: !!channels.digitalBrevlada,
        label: 'Digital brevlåda',
        send: () => this.messagingService.sendDigitalMail(partyId, DECISION_SUBJECT, DECISION_BODY, pdfBase64),
      },
      {
        selected: !!channels.brev,
        label: 'Brev',
        send: () => this.messagingService.sendLetter(partyId, DECISION_SUBJECT, DECISION_BODY, pdfBase64),
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
