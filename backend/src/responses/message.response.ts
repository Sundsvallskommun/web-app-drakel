import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

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
  @IsString()
  @IsOptional()
  created?: string;
}

export class MessagesApiResponse implements ApiResponse<Message[]> {
  @ValidateNested({ each: true })
  @Type(() => Message)
  data!: Message[];
  @IsString()
  message!: string;
}
