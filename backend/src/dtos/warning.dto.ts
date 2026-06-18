import { IsIn, IsString } from 'class-validator';

/** The two statuses a handläggare can set a warning to: acknowledge it or close it. */
export const WARNING_STATUS_UPDATES = ['ACKNOWLEDGED', 'CLOSED'] as const;

export class UpdateWarningStatusDto {
  @IsString()
  @IsIn(WARNING_STATUS_UPDATES)
  status!: (typeof WARNING_STATUS_UPDATES)[number];
}
