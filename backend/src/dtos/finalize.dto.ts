import { IsOptional, IsString, MaxLength } from 'class-validator';

import { DecisionNotificationDto } from '@/dtos/decision-notification.dto';

/**
 * What the handläggare sends with "Besluta och utbetala": the channels the beslut goes out through, plus
 * the orsak picked on the Beslut tab. Everything else in the finalize payload — outcome, period, amount,
 * beslutsmeddelande and the utbetalningar — is what they already saved on the errand, so the BFF reads it
 * from caremanagement rather than trusting a second copy from the browser.
 */
export class FinalizeErrandDto extends DecisionNotificationDto {
  /** The sökandes orsak. Left out, the beslutsförslag's proposed orsak is used. */
  @IsString()
  @MaxLength(4096)
  @IsOptional()
  reason?: string;
}
