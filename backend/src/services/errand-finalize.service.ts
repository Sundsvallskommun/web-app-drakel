import { UploadedFileLike } from '@interfaces/file.interface';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementHouseholdSizeService from '@services/caremanagement-household-size.service';
import DecisionDocumentsService from '@services/decision-documents.service';
import DecisionNotificationService from '@services/decision-notification.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import ErrandLifecareSectionStatusService from '@services/errand-lifecare-section-status.service';
import { finalizeBlocker } from '@utils/finalize-blocker';
import { buildFinalizeRequest } from '@utils/finalize-request';
import { toFinalizeResult } from '@utils/finalize-result';
import { logger } from '@utils/logger';

import { FinalizeErrandDto } from '@/dtos/finalize.dto';
import { HttpException } from '@/exceptions/HttpException';
import { FinalizeResult } from '@/responses/finalize.response';

// The labels the beslut dialog uses for the channels, reported back when a channel could not be sent.
const ALL_CHANNEL_LABELS = { meddelande: 'Meddelande', brev: 'Brev' } as const;

const selectedChannelLabels = (input: FinalizeErrandDto): string[] =>
  (Object.keys(ALL_CHANNEL_LABELS) as (keyof typeof ALL_CHANNEL_LABELS)[])
    .filter(channel => input[channel])
    .map(channel => ALL_CHANNEL_LABELS[channel]);

/**
 * "Skicka beräkning och beslut": finalizes the errand in caremanagement and then sends the beslut to the applicant,
 * in an order that sends nothing unless careM has the decision, and decides nothing that cannot be sent:
 *
 * 1. Everything the beslut rests on is done in Lifecare — the beräkning slutlig, the beslut saved and, for a beslut
 *    that grants something, the utbetalning registered. careM's finalize does not check the beräkning itself.
 * 2. Every PDF that goes out is fetched; one Lifecare cannot hand over stops the send here, with nothing decided.
 * 3. careM finalizes: it reads the saved beslut from Lifecare, records it as the PAYMENT decision, ties it to the
 *    Lifecare beslut (reported back as `lifecareDecision`) and resumes the process. No utbetalningar go with it:
 *    the Utbetalning tab registers them in Lifecare directly.
 * 4. The beslut is kept on the errand and the message goes out through the chosen channels.
 *
 * Once caremanagement has accepted the finalize the errand is decided and cannot be finalized again, so every
 * step after it is best-effort and reported in the result rather than thrown.
 */
class ErrandFinalizeService {
  private decisionService = new CaremanagementDecisionService();
  private householdSize = new CaremanagementHouseholdSizeService();
  private notificationService = new DecisionNotificationService();
  private documents = new DecisionDocumentsService();
  private sectionStatus = new ErrandLifecareSectionStatusService();
  private lifecareDecision = new ErrandLifecareDecisionService();
  private errandService = new CaremanagementErrandService();

  async finalize(errandId: string, input: FinalizeErrandDto, author: string, files: UploadedFileLike[] = []): Promise<FinalizeResult> {
    const [status, beslut, errand] = await Promise.all([
      this.sectionStatus.read(errandId),
      this.lifecareDecision.read(errandId),
      this.errandService.getErrand(errandId),
    ]);
    const blocker = finalizeBlocker(status, beslut?.outcome);
    if (blocker) {
      throw new HttpException(409, blocker);
    }

    const documents = await this.documents.collect(errandId, errand.data?.errandNumber ?? errandId, input, files);

    const householdSizeChanged = await this.householdSize.readHouseholdSizeChanged(errandId);
    // careM's refusals (400, 409, 422, 502 …) pass through with careM's own sentence and stop the finalize before
    // anything is sent.
    const finalized = (await this.decisionService.finalize(errandId, buildFinalizeRequest(input, householdSizeChanged))).data;

    const decisionAttachmentSaved = await this.documents.saveDecisionOnErrand(errandId, documents.decision);
    const failedChannels = await this.sendBeslut(errandId, input, author, documents.attachments);
    return toFinalizeResult(finalized, failedChannels, decisionAttachmentSaved);
  }

  /** Sends the beslut, reporting every selected channel as failed when the send could not even start. */
  private async sendBeslut(errandId: string, input: FinalizeErrandDto, author: string, attachments: UploadedFileLike[]): Promise<string[]> {
    try {
      return await this.notificationService.send(errandId, input, author, attachments);
    } catch {
      logger.warn(`Finalized errand ${errandId} but could not send the beslut`);
      return selectedChannelLabels(input);
    }
  }
}

export default ErrandFinalizeService;
