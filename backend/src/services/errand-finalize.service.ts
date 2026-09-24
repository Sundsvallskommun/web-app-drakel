import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import DecisionNotificationService from '@services/decision-notification.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import { buildFinalizeRequest } from '@utils/finalize-request';
import { logger } from '@utils/logger';

import { CommunicationChannels, FinalizeResponse } from '@/data-contracts/caremanagement/data-contracts';
import { FinalizeErrandDto } from '@/dtos/finalize.dto';
import { DecisionRegistration } from '@/responses/decision-registration.response';
import { FinalizeResult } from '@/responses/finalize.response';

// The labels the beslut dialog uses for the channels, reported back when a channel could not be sent.
const ALL_CHANNEL_LABELS = { minaSidor: 'Mina sidor', digitalBrevlada: 'Digital brevlåda', brev: 'Brev' } as const;

const toCommunicationChannels = (input: FinalizeErrandDto): CommunicationChannels => ({
  minaSidor: !!input.minaSidor,
  digitalMailbox: !!input.digitalBrevlada,
  letter: !!input.brev,
});

const selectedChannelLabels = (input: FinalizeErrandDto): string[] =>
  (Object.keys(ALL_CHANNEL_LABELS) as (keyof typeof ALL_CHANNEL_LABELS)[])
    .filter(channel => input[channel])
    .map(channel => ALL_CHANNEL_LABELS[channel]);

const toFinalizeResult = (
  finalized: FinalizeResponse | undefined,
  lifecareDecision: DecisionRegistration | undefined,
  failedChannels: string[],
): FinalizeResult => ({
  decisionId: finalized?.decisionId,
  processMessageCorrelated: finalized?.processMessageCorrelated ?? false,
  lifecareDecision,
  failedChannels,
});

/**
 * "Besluta och utbetala": finalizes the errand in caremanagement and then sends the beslut to the applicant.
 *
 * The beslut is already in Lifecare — the Beslut tab saves it there — so finalize reads it from Lifecare
 * and hands careM that. caremanagement records the PAYMENT decision and resumes the process (which sets the
 * errand GRANTED/REJECTED). No utbetalningar go with it: the Utbetalning tab registers them in Lifecare
 * directly. The BFF then links careM's decision to the Lifecare beslut and last sends Lifecare's print of
 * the beslut to the applicant through the chosen channels.
 *
 * Once caremanagement has accepted the finalize the errand is decided and cannot be finalized again, so every
 * step after it is best-effort and reported in the result rather than thrown.
 */
class ErrandFinalizeService {
  private decisionService = new CaremanagementDecisionService();
  private normberakningService = new CaremanagementNormberakningService();
  private notificationService = new DecisionNotificationService();
  private lifecareDecision = new ErrandLifecareDecisionService();

  async finalize(errandId: string, input: FinalizeErrandDto, author: string): Promise<FinalizeResult> {
    const [beslut, householdSizeChanged] = await Promise.all([
      this.lifecareDecision.read(errandId),
      this.normberakningService.readHouseholdSizeChanged(errandId),
    ]);
    const request = buildFinalizeRequest({
      beslut,
      communication: toCommunicationChannels(input),
      householdSizeChanged,
    });

    const finalized = await this.decisionService.finalize(errandId, request);

    const lifecareDecision =
      finalized.data.decisionId && beslut ? await this.lifecareDecision.receiptFinalized(errandId, finalized.data.decisionId, beslut.id) : undefined;
    const failedChannels = await this.sendBeslut(errandId, input, author);
    return toFinalizeResult(finalized.data, lifecareDecision, failedChannels);
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
