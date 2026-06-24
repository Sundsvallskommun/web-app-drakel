import { IsBoolean } from 'class-validator';

/** Body for acknowledging (or withdrawing acknowledgement of) a notification. */
export class AcknowledgeNotificationDto {
  @IsBoolean()
  acknowledged!: boolean;
}
