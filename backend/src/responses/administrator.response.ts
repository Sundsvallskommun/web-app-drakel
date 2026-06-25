import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

/** A handläggare from Active Directory. `username` is the AD account, i.e. an errand's assignedUserId. */
export class Administrator {
  @IsString()
  @IsOptional()
  username?: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  @IsString()
  @IsOptional()
  description?: string;
}

export class AdministratorsApiResponse implements ApiResponse<Administrator[]> {
  @ValidateNested({ each: true })
  @Type(() => Administrator)
  data!: Administrator[];
  @IsString()
  message!: string;
}
