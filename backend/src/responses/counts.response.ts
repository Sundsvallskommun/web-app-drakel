import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';

/** Per-errand badge counts (notes, active warnings, bevakningar, unread messages). */
export class ErrandCounts {
  @IsNumber()
  notes!: number;
  @IsNumber()
  warnings!: number;
  @IsNumber()
  bevakningar!: number;
  /** Messages addressed to the caller that haven't been marked read. */
  @IsNumber()
  unreadMessages!: number;
}

export class ErrandCountsApiResponse implements ApiResponse<ErrandCounts> {
  @ValidateNested()
  @Type(() => ErrandCounts)
  data!: ErrandCounts;
  @IsString()
  message!: string;
}
