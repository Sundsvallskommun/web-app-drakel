import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/** Metadata of a file attached to a message, mirroring caremanagement's MessageAttachment model. */
export class MessageAttachment {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  fileName?: string;
  @IsString()
  @IsOptional()
  mimeType?: string;
  @IsNumber()
  @IsOptional()
  fileSize?: number;
  @IsString()
  @IsOptional()
  created?: string;
}

/** A single message in an errand's conversation, mirroring caremanagement's Message model. */
export class Message {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  errandId?: string;
  /** INBOUND = applicant → caseworker, OUTBOUND = caseworker → applicant. */
  @IsString()
  @IsOptional()
  direction?: string;
  @IsString()
  @IsOptional()
  body?: string;
  @IsString()
  @IsOptional()
  author?: string;
  /** Id of the message this one replies to, when it is a reply (always on the same errand). */
  @IsString()
  @IsOptional()
  inReplyToId?: string;
  @IsString()
  @IsOptional()
  created?: string;
  /** Files attached to the message; each downloaded individually via the attachment-file endpoint. */
  @ValidateNested({ each: true })
  @Type(() => MessageAttachment)
  @IsOptional()
  attachments?: MessageAttachment[];
}

export class MessagesApiResponse implements ApiResponse<Message[]> {
  @ValidateNested({ each: true })
  @Type(() => Message)
  data!: Message[];
  @IsString()
  message!: string;
}
