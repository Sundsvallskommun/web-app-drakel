import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsString, ValidateNested } from 'class-validator';

/** Whether the applicant has a reachable digital mailbox (so the "Digital brevlåda" channel is offered). */
export class DigitalMailboxStatus {
  @IsBoolean() available!: boolean;
}

export class DigitalMailboxApiResponse implements ApiResponse<DigitalMailboxStatus> {
  @ValidateNested()
  @Type(() => DigitalMailboxStatus)
  data!: DigitalMailboxStatus;
  @IsString()
  message!: string;
}
