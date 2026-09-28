import { IsIn, IsString } from 'class-validator';

import { UpdateWarningParamsStatusEnum } from '@/data-contracts/caremanagement/data-contracts';

/** The statuses a handläggare can set a warning to — re-open it, acknowledge it or close it — as careM's contract lists them. */
export type WarningStatusUpdate = `${UpdateWarningParamsStatusEnum}`;

const WARNING_STATUS_UPDATES: WarningStatusUpdate[] = Object.values(UpdateWarningParamsStatusEnum);

export class UpdateWarningStatusDto {
  @IsString()
  @IsIn(WARNING_STATUS_UPDATES)
  status!: WarningStatusUpdate;
}
