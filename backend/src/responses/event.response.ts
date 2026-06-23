import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/** A single entry in an errand's activity log (who did what, when). */
export class ErrandEvent {
  @IsString()
  @IsOptional()
  id?: string;
  @IsString()
  @IsOptional()
  errandId?: string;
  /** READ / CREATE / UPDATE / DELETE. */
  @IsString()
  @IsOptional()
  action?: string;
  /** What the event concerns (e.g. errand, decisions, financial-assistance/calculation/draft/incomes). */
  @IsString()
  @IsOptional()
  target?: string;
  @IsString()
  @IsOptional()
  description?: string;
  @IsString()
  @IsOptional()
  httpMethod?: string;
  @IsString()
  @IsOptional()
  requestPath?: string;
  /** Who performed the action (null when no X-Sent-By header was sent). */
  @IsString()
  @IsOptional()
  actor?: string;
  /** The kind of actor id (e.g. adAccount, partyId). */
  @IsString()
  @IsOptional()
  actorType?: string;
  @IsNumber()
  @IsOptional()
  statusCode?: number;
  @IsString()
  @IsOptional()
  created?: string;
}

export class ErrandEventsApiResponse implements ApiResponse<ErrandEvent[]> {
  @ValidateNested({ each: true })
  @Type(() => ErrandEvent)
  data!: ErrandEvent[];
  @IsString()
  message!: string;
}
