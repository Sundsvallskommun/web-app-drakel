import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Body for changing a notification's state. Both fields are optional and an omitted one is left alone,
 * which mirrors caremanagement's PATCH.
 *
 * The two states are separate on purpose: acknowledged says the handläggare has seen the notification,
 * handled that they have acted on it. Marking one handled also acknowledges it — caremanagement does
 * that itself — but reading it does not make it handled.
 */
export class UpdateNotificationDto {
  @IsBoolean()
  @IsOptional()
  acknowledged?: boolean;

  @IsBoolean()
  @IsOptional()
  handled?: boolean;
}
