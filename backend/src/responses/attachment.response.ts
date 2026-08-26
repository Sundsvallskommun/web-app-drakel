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
  /** What kind of document this is: APPLICATION / CONVERSATION / GENERATED / ERRAND / CASE_DATA / DECISION / MESSAGE_HISTORY. */
  @IsString()
  @IsOptional()
  documentType?: string;
  /** Who sent the file: CLIENT (applicant) / CASEWORKER (caseworker). */
  @IsString()
  @IsOptional()
  senderRole?: string;
  /** Set on CONVERSATION files — the message the file belongs to (downloaded via the message endpoint). */
  @IsString()
  @IsOptional()
  messageId?: string;
}

export class AttachmentsApiResponse implements ApiResponse<Attachment[]> {
  @ValidateNested({ each: true })
  @Type(() => Attachment)
  data!: Attachment[];
  @IsString()
  message!: string;
}
