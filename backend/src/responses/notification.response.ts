import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

/** A notification addressed to a handläggare (e.g. a new message from the applicant). */
export class ErrandNotification {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  errandId?: string;
  /** Recipient user id. */
  @IsString()
  @IsOptional()
  ownerId?: string;
  /** Who/what produced the notification. */
  @IsString()
  @IsOptional()
  createdBy?: string;
  /** CREATE / UPDATE / DELETE. */
  @IsString()
  @IsOptional()
  type?: string;
  /** ERRAND / DECISION / ATTACHMENT / STAKEHOLDER / PARAMETER / MESSAGE / SYSTEM. */
  @IsString()
  @IsOptional()
  subType?: string;
  @IsString()
  @IsOptional()
  description?: string;
  @IsString()
  @IsOptional()
  content?: string;
  @IsBoolean()
  @IsOptional()
  acknowledged?: boolean;
  @IsString()
  @IsOptional()
  created?: string;
  @IsString()
  @IsOptional()
  modified?: string;
}

export class ErrandNotificationsApiResponse implements ApiResponse<ErrandNotification[]> {
  @ValidateNested({ each: true })
  @Type(() => ErrandNotification)
  data!: ErrandNotification[];
  @IsString()
  message!: string;
}

export class ErrandNotificationApiResponse implements ApiResponse<ErrandNotification> {
  @ValidateNested()
  @Type(() => ErrandNotification)
  data!: ErrandNotification;
  @IsString()
  message!: string;
}
