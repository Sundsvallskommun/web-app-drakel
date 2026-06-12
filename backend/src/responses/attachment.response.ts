import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export class Attachment {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  fileName?: string;
  @IsString()
  @IsOptional()
  mimeType?: string;
  @IsInt()
  @IsOptional()
  fileSize?: number;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modified?: string;
}

export class AttachmentsApiResponse implements ApiResponse<Attachment[]> {
  @ValidateNested({ each: true })
  @Type(() => Attachment)
  data!: Attachment[];
  @IsString()
  message!: string;
}
