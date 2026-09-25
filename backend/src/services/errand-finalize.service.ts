import { HttpException } from '@exceptions/HttpException';
import CaremanagementDecisionService from '@services/caremanagement-decision.service';
import CaremanagementHouseholdSizeService from '@services/caremanagement-household-size.service';
import DecisionNotificationService from '@services/decision-notification.service';
import { buildFinalizeRequest } from '@utils/finalize-request';
import { toFinalizeResult } from '@utils/finalize-result';
import { httpStatusOf } from '@utils/http-error-status';
import { logger } from '@utils/logger';

import { FinalizeRequest, FinalizeResponse } from '@/data-contracts/caremanagement/data-contracts';
import { FinalizeErrandDto } from '@/dtos/finalize.dto';
import { FinalizeResult } from '@/responses/finalize.response';

// The labels the beslut dialog uses for the channels, reported back when a channel could not be sent.
const ALL_CHANNEL_LABELS = { minaSidor: 'Mina sidor', digitalBrevlada: 'Digital brevlåda', brev: 'Brev' } as const;

const BAD_REQUEST = 400;

// careM answers 400 when no beslut is saved in Lifecare or its beslutstyp cannot be finalized. Its own sentence
// does not reach this far (caremanagementError keeps no 400 detail), so the handläggare is told what to do here.
const BESLUT_NOT_FINALIZABLE =
  'Beslutet i Lifecare går inte att verkställa. Spara beslutet, med en beslutstyp som går att verkställa från Drakel, innan du beslutar och betalar ut.';

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
    const finalized = await this.finalizeInCaremanagement(errandId, buildFinalizeRequest(input, householdSizeChanged));
    const failedChannels = await this.sendBeslut(errandId, input, author);
    return toFinalizeResult(finalized, failedChannels);
  }

  /** careM's refusals (409, 422, 502 …) pass through with careM's reason; a 400 is put in words the handläggare can act on. */
  private async finalizeInCaremanagement(errandId: string, request: FinalizeRequest): Promise<FinalizeResponse> {
    try {
      return (await this.decisionService.finalize(errandId, request)).data;
    } catch (error) {
      if (httpStatusOf(error) === BAD_REQUEST) {
        throw new HttpException(BAD_REQUEST, BESLUT_NOT_FINALIZABLE);
      }
      throw error;
    }
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
