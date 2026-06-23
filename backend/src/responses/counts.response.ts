import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsNumber, IsString, ValidateNested } from 'class-validator';

/** Per-errand badge counts (notes, active warnings, bevakningar). */
export class ErrandCounts {
  @IsNumber()
  notes!: number;
  @IsNumber()
  warnings!: number;
  @IsNumber()
  bevakningar!: number;
}

export class ErrandCountsApiResponse implements ApiResponse<ErrandCounts> {
  @ValidateNested()
  @Type(() => ErrandCounts)
  data!: ErrandCounts;
  @IsString()
  message!: string;
}
