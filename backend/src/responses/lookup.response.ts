import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

/** Metadata entry (category, status, type, role or contact reason) */
export class Lookup {
  @IsString()
  @IsOptional()
  name?: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modified?: string;
}

export class LookupsApiResponse implements ApiResponse<Lookup[]> {
  @ValidateNested({ each: true })
  @Type(() => Lookup)
  data!: Lookup[];
  @IsString()
  message!: string;
}
