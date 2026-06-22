import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

/** A bevakning (date-bound watch/reminder) on an errand. */
export class Bevakning {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  title?: string;
  @IsString()
  @IsOptional()
  description?: string;
  /** Bevakningsdatum — when the watch becomes relevant. */
  @IsString()
  @IsOptional()
  startDate?: string;
  /** When the watch ends — open-ended when omitted. */
  @IsString()
  @IsOptional()
  endDate?: string;
  @IsString()
  @IsOptional()
  createdBy?: string;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  updated?: string;
}

export class BevakningarApiResponse implements ApiResponse<Bevakning[]> {
  @ValidateNested({ each: true })
  @Type(() => Bevakning)
  data!: Bevakning[];
  @IsString()
  message!: string;
}

export class BevakningApiResponse implements ApiResponse<Bevakning> {
  @ValidateNested()
  @Type(() => Bevakning)
  data!: Bevakning;
  @IsString()
  message!: string;
}
