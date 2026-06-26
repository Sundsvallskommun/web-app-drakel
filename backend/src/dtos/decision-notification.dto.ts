import { IsBoolean, IsOptional } from 'class-validator';

/** Which channels the beslut notification is sent through (each defaults to off when omitted). */
export class DecisionNotificationDto {
  /** Mina sidor (e-service inbox / web message). */
  @IsBoolean() @IsOptional() minaSidor?: boolean;
  /** Digital brevlåda (digital mail) — only offered when the applicant has a reachable mailbox. */
  @IsBoolean() @IsOptional() digitalBrevlada?: boolean;
  /** Brev (physical letter / snail mail). */
  @IsBoolean() @IsOptional() brev?: boolean;
}
