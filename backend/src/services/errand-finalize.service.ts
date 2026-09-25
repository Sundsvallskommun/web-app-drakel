import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementHouseholdSizeService from '@services/caremanagement-household-size.service';
import DecisionNotificationService from '@services/decision-notification.service';
import { buildFinalizeRequest } from '@utils/finalize-request';
import { toFinalizeResult } from '@utils/finalize-result';
import { logger } from '@utils/logger';

import { FinalizeErrandDto } from '@/dtos/finalize.dto';
import { FinalizeResult } from '@/responses/finalize.response';

// The labels the beslut dialog uses for the channels, reported back when a channel could not be sent.
const ALL_CHANNEL_LABELS = { minaSidor: 'Mina sidor', digitalBrevlada: 'Digital brevlåda', brev: 'Brev' } as const;

const selectedChannelLabels = (input: FinalizeErrandDto): string[] =>
  (Object.keys(ALL_CHANNEL_LABELS) as (keyof typeof ALL_CHANNEL_LABELS)[])
    .filter(channel => input[channel])
    .map(channel => ALL_CHANNEL_LABELS[channel]);

/**
 * "Besluta och utbetala": finalizes the errand in caremanagement and then sends the beslut to the applicant.
 *
 * careM does the Lifecare part itself: it reads the beslut the Beslut tab saved in Lifecare, records it as the
 * PAYMENT decision, ties that decision to the Lifecare beslut (reported back as `lifecareDecision`) and resumes
 * the process, which sets the errand GRANTED/REJECTED. No utbetalningar go with it: the Utbetalning tab registers
 * them in Lifecare directly. The BFF then sends Lifecare's print of the beslut through the chosen channels.
 *
 * Once caremanagement has accepted the finalize the errand is decided and cannot be finalized again, so every
 * step after it is best-effort and reported in the result rather than thrown.
 */
class ErrandFinalizeService {
  private decisionService = new CaremanagementDecisionService();
  private householdSize = new CaremanagementHouseholdSizeService();
  private notificationService = new DecisionNotificationService();

  async finalize(errandId: string, input: FinalizeErrandDto, author: string): Promise<FinalizeResult> {
    const householdSizeChanged = await this.householdSize.readHouseholdSizeChanged(errandId);
    // careM's refusals (400, 409, 422, 502 …) pass through with careM's own sentence — e.g. "Spara beslutet innan du
    // beslutar och betalar ut." — and stop the finalize before anything is sent.
    const finalized = (await this.decisionService.finalize(errandId, buildFinalizeRequest(input, householdSizeChanged))).data;
    const failedChannels = await this.sendBeslut(errandId, input, author);
    return toFinalizeResult(finalized, failedChannels);
  }

  /** Sends the beslut, reporting every selected channel as failed when the send could not even start. */
  private async sendBeslut(errandId: string, input: FinalizeErrandDto, author: string): Promise<string[]> {
    try {
      return await this.notificationService.send(errandId, input, author);
    } catch {
      logger.warn(`Finalized errand ${errandId} but could not send the beslut`);
      return selectedChannelLabels(input);
    }
  }
}

export default ErrandFinalizeService;
