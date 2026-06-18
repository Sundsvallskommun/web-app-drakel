import { IsIn, IsString } from 'class-validator';

/** The statuses a handläggare can set a warning to: re-open it, acknowledge it or close it. */
export const WARNING_STATUS_UPDATES = ['OPEN', 'ACKNOWLEDGED', 'CLOSED'] as const;

export class UpdateWarningStatusDto {
  @IsString()
  @IsIn(WARNING_STATUS_UPDATES)
  status!: (typeof WARNING_STATUS_UPDATES)[number];
}
