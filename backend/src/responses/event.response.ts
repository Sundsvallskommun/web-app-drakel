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
  /** HTTP (access log) or EVENT (domain-event change log). */
  @IsString()
  @IsOptional()
  source?: string;
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

/**
 * One actor's activity across every errand. `total` is how many events match the filters in all, while
 * `events` is the capped listing — they differ when the period holds more than caremanagement returns.
 */
export class ActorEventLog {
  @ValidateNested({ each: true })
  @Type(() => ErrandEvent)
  events!: ErrandEvent[];
  @IsNumber()
  total!: number;
}

export class ActorEventLogApiResponse implements ApiResponse<ActorEventLog> {
  @ValidateNested()
  @Type(() => ActorEventLog)
  data!: ActorEventLog;
  @IsString()
  message!: string;
}

export class ErrandEventsApiResponse implements ApiResponse<ErrandEvent[]> {
  @ValidateNested({ each: true })
  @Type(() => ErrandEvent)
  data!: ErrandEvent[];
  @IsString()
  message!: string;
}
