import { CommunicationChannels, FinalizeRequest } from '@/data-contracts/caremanagement/data-contracts';
import { FinalizeErrandDto } from '@/dtos/finalize.dto';

// careM has no meddelande channel: the meddelande goes into the errand's own conversation, which careM already
// holds. Digital brevlåda is not offered.
const toCommunicationChannels = (input: FinalizeErrandDto): CommunicationChannels => ({
  minaSidor: !!input.minaSidor,
  digitalMailbox: false,
  letter: !!input.brev,
});

/**
 * careM's finalize request: the channels the handläggare chose and whether the household size was changed.
 * It carries no decision — careM then reads the beslut the errand is linked to in Lifecare itself (outcome,
 * orsak, period, amount and beslutsmeddelande), and no utbetalningar: the Utbetalning tab registers them in
 * Lifecare directly.
 */
export const buildFinalizeRequest = (input: FinalizeErrandDto, householdSizeChanged: boolean): FinalizeRequest => ({
  communication: toCommunicationChannels(input),
  householdSizeChanged,
});
