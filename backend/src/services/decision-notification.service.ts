import CaremanagementAttachmentService, { UploadedFileLike } from '@services/caremanagement-attachment.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import ErrandLifecareCalculationService from '@services/errand-lifecare-calculation.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import MessagingService from '@services/messaging.service';

import { FinalizeErrandDto } from '@/dtos/finalize.dto';

const DECISION_DOCUMENT_TYPE = 'DECISION';
const DECISION_SUBJECT = 'Beslut om ekonomiskt bistånd';
const PDF_MIME_TYPE = 'application/pdf';

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
  private lifecareCalculation = new ErrandLifecareCalculationService();
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

  /** The PDFs that go with the message: Lifecare's beslut and beräkning when kept, and the handläggare's own files. */
  private async attachmentsFor(
    errandId: string,
    errandNumber: string,
    input: FinalizeErrandDto,
    files: UploadedFileLike[],
  ): Promise<UploadedFileLike[]> {
    const [decision, calculation] = await Promise.all([
      this.lifecareDecision.pdf(errandId),
      input.includeCalculation ? this.lifecareCalculation.pdf(errandId) : Promise.resolve(undefined),
    ]);
    // Lifecare's print of the beslut is always kept on the errand as its DECISION attachment, sent or not.
    const decisionFile = { buffer: decision, originalname: `beslut-${errandNumber}.pdf`, mimetype: PDF_MIME_TYPE };
    await this.attachmentService.createAttachment(errandId, decisionFile, DECISION_DOCUMENT_TYPE);
    return [
      ...(input.includeDecision ? [decisionFile] : []),
      ...(calculation ? [{ buffer: calculation, originalname: `normberakning-${errandNumber}.pdf`, mimetype: PDF_MIME_TYPE }] : []),
      ...files,
    ];
  }

  /**
   * Sends the handläggare's message, with the beslut, the beräkning and the files they chose, through the selected
   * channels and resolves with the labels of the ones that failed. Each channel is sent independently so one failing
   * channel does not abort the others.
   */
  async send(errandId: string, input: FinalizeErrandDto, author: string, files: UploadedFileLike[] = []): Promise<string[]> {
    const errand = await this.errandService.getErrand(errandId);
    const attachments = await this.attachmentsFor(errandId, errand.data?.errandNumber ?? errandId, input, files);
    const pdfs = attachments.map(file => ({ filename: file.originalname, content: file.buffer.toString('base64') }));
    const body = input.message;

    // The applicant's partyId is only needed by the digital brevlåda / brev channels; Mina sidor goes
    // through the errand's e-service conversation, which doesn't need it.
    const partyId = (await this.resolveApplicantPartyId(errandId)) ?? '';

    const allChannels: Channel[] = [
      {
        selected: !!input.minaSidor,
        label: 'Mina sidor',
        send: async () => {
          await this.messageService.createMessage(errandId, { direction: 'OUTBOUND', body, author }, attachments);
        },
      },
      {
        selected: !!input.digitalBrevlada,
        label: 'Digital brevlåda',
        send: () => this.messagingService.sendDigitalMail(partyId, DECISION_SUBJECT, body, pdfs),
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
