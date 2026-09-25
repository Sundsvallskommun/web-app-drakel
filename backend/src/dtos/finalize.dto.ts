import { IsBoolean, IsString, MaxLength } from 'class-validator';

import { DecisionNotificationDto } from '@/dtos/decision-notification.dto';

/**
 * What the handläggare sends with "Skicka beräkning och beslut": the channels, the message to the sökande and
 * which of Lifecare's documents go with it. Files from the handläggare's computer come beside it in the same
 * multipart request. Everything else in the finalize payload is what they already saved — careM reads the beslut, orsak
 * included, from Lifecare itself, and the Utbetalning tab has registered the utbetalningar there — rather than
 * trusting a second copy from the browser.
 */
export class FinalizeErrandDto extends DecisionNotificationDto {
  /** The message to the sökande as HTML, as the handläggare left it in the editor. */
  @IsString()
  @MaxLength(8192)
  message!: string;

  /** Whether Lifecare's print of the beslut goes with the message. */
  @IsBoolean()
  includeDecision!: boolean;

  /** Whether Lifecare's print of the normberäkning goes with the message. */
  @IsBoolean()
  includeCalculation!: boolean;
}
