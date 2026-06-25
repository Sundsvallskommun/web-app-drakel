import { RequestWithUser } from '@interfaces/auth.interface';
import authMiddleware from '@middlewares/auth.middleware';
import { validationMiddleware } from '@middlewares/validation.middleware';
import CaremanagementAttachmentService from '@services/caremanagement-attachment.service';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementMessageService from '@services/caremanagement-message.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import MessagingService from '@services/messaging.service';
import TemplatingService from '@services/templating.service';
import { Body, Controller, Get, Param, Post, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import { DecisionNotificationDto, DecisionPreviewDto } from '@/dtos/decision-notification.dto';
import { HttpException } from '@/exceptions/HttpException';
import { DigitalMailboxApiResponse } from '@/responses/digital-mailbox.response';

const DECISION_ORIGIN = 'DECISION';
const DECISION_SUBJECT = 'Beslut om ekonomiskt bistånd';
// Short cover text; the actual beslut is the attached PDF.
const DECISION_BODY = 'Du har fått ett beslut om ekonomiskt bistånd. Beslutet finns i den bifogade filen.';

/**
 * Finalises a beslut: renders the decision message to a PDF, saves it on the errand as a DECISION
 * attachment, and sends it to the applicant through the chosen Messaging channels (Mina sidor / digital
 * brevlåda / brev). Also reports whether the applicant has a digital mailbox so the UI can offer that channel.
 */
@Controller()
export class DecisionNotificationController {
  private decisionService = new CaremanagementDecisionService();
  private errandService = new CaremanagementErrandService();
  private templatingService = new TemplatingService();
  private attachmentService = new CaremanagementAttachmentService();
  private stakeholderService = new CaremanagementStakeholderService();
  private messageService = new CaremanagementMessageService();
  private messagingService = new MessagingService();

  private async resolveApplicantPartyId(errandId: string): Promise<string | undefined> {
    const stakeholders = await this.stakeholderService.readStakeholders(errandId);
    return (stakeholders.data ?? []).find((stakeholder) => stakeholder.role === 'APPLICANT')?.externalId;
  }

  @Get('/errands/:errandId/digital-mailbox')
  @OpenAPI({ summary: 'Whether the applicant has a reachable digital mailbox' })
  @ResponseSchema(DigitalMailboxApiResponse)
  @UseBefore(authMiddleware)
  async digitalMailbox(@Param('errandId') errandId: string) {
    const partyId = await this.resolveApplicantPartyId(errandId);
    if (!partyId) {
      return { data: { available: false }, message: 'success' };
    }
    try {
      const available = await this.messagingService.hasDigitalMailbox(partyId);
      return { data: { available }, message: 'success' };
    } catch {
      // A failing mailbox lookup must not block the flow — just don't offer the digital-brevlåda channel.
      return { data: { available: false }, message: 'mailbox lookup failed' };
    }
  }

  @Post('/errands/:errandId/decision-notification/preview')
  @OpenAPI({ summary: 'Render a beslutsmeddelande to a PDF for preview (not saved or sent)' })
  @UseBefore(authMiddleware, validationMiddleware(DecisionPreviewDto, 'body'))
  async preview(@Body() input: DecisionPreviewDto) {
    const pdfBase64 = await this.templatingService.renderHtmlToPdf(input.message);
    if (!pdfBase64) {
      throw new HttpException(502, 'Failed to render the decision PDF');
    }
    return { data: { pdfBase64 }, message: 'success' };
  }

  @Post('/errands/:errandId/decision-notification')
  @OpenAPI({ summary: 'Render the beslut PDF, save it as a DECISION attachment, and send it to the chosen channels' })
  @UseBefore(authMiddleware, validationMiddleware(DecisionNotificationDto, 'body'))
  async send(@Req() req: RequestWithUser, @Param('errandId') errandId: string, @Body() input: DecisionNotificationDto) {
    const decisions = await this.decisionService.readDecisions(errandId);
    const decisionMessage = [...(decisions.data ?? [])]
      .reverse()
      .find((decision) => (decision.decisionMessage ?? '').trim().length > 0)?.decisionMessage;
    if (!decisionMessage) {
      throw new HttpException(400, 'No decision message to send');
    }

    const pdfBase64 = await this.templatingService.renderHtmlToPdf(decisionMessage);
    if (!pdfBase64) {
      throw new HttpException(502, 'Failed to render the decision PDF');
    }

    // Save the rendered PDF on the errand as the DECISION attachment, named beslut-<ärendenummer>.pdf.
    const errand = await this.errandService.getErrand(errandId);
    const filename = `beslut-${errand.data?.errandNumber ?? errandId}.pdf`;
    const pdfFile = { buffer: Buffer.from(pdfBase64, 'base64'), originalname: filename, mimetype: 'application/pdf' };
    await this.attachmentService.createAttachment(errandId, pdfFile, DECISION_ORIGIN);

    // The applicant's partyId is only needed by the digital brevlåda / brev channels; Mina sidor goes
    // through the errand's e-service conversation, which doesn't need it.
    const partyId = (await this.resolveApplicantPartyId(errandId)) ?? '';

    // Send each selected channel independently so one failing channel doesn't abort the others — the failed
    // channels are reported instead. Mina sidor is the errand's e-service message (with the PDF attached).
    const channels: { selected: boolean; label: string; send: () => Promise<void> }[] = [
      {
        selected: !!input.minaSidor,
        label: 'Mina sidor',
        send: async () => {
          await this.messageService.createMessage(
            errandId,
            { direction: 'OUTBOUND', body: DECISION_BODY, author: req.user.username },
            [pdfFile]
          );
        },
      },
      {
        selected: !!input.digitalBrevlada,
        label: 'Digital brevlåda',
        send: () => this.messagingService.sendDigitalMail(partyId, DECISION_SUBJECT, DECISION_BODY, pdfBase64),
      },
      {
        selected: !!input.brev,
        label: 'Brev',
        send: () => this.messagingService.sendLetter(partyId, DECISION_SUBJECT, DECISION_BODY, pdfBase64),
      },
    ];
    const selected = channels.filter((channel) => channel.selected);
    const failedChannels: string[] = [];
    await Promise.all(
      selected.map(async (channel) => {
        try {
          await channel.send();
        } catch {
          failedChannels.push(channel.label);
        }
      })
    );
    // Only treat it as an outright failure when every requested channel failed.
    if (selected.length > 0 && failedChannels.length === selected.length) {
      throw new HttpException(502, `Kunde inte skicka beslutet till: ${failedChannels.join(', ')}`);
    }
    return { data: { failedChannels }, message: 'success' };
  }
}
