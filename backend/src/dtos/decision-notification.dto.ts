import { IsBoolean, IsOptional } from 'class-validator';

/** Which channels the beslut notification is sent through (each defaults to off when omitted). */
export class DecisionNotificationDto {
  /**
   * Mina sidor — the beslut as a document on the sökande's Mina sidor (a party asset). Recorded in caremanagement,
   * but nothing is sent there yet.
   */
  @IsBoolean() @IsOptional() minaSidor?: boolean;
  /** Meddelande — a message in the errand's conversation, like the errand's other messages. */
  @IsBoolean() @IsOptional() meddelande?: boolean;
  /** Brev (physical letter / snail mail). */
  @IsBoolean() @IsOptional() brev?: boolean;
}
