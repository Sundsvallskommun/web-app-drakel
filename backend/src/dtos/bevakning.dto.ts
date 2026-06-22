import { IsOptional, IsString } from 'class-validator';

/**
 * The fields a handläggare sends when creating or replacing a bevakning (date-bound watch/reminder).
 * `createdBy` is taken from the auth context, not the request body.
 */
export class BevakningInputDto {
  /** Short headline for the bevakning. */
  @IsString()
  title!: string;

  /** Free-text details of what to watch for. */
  @IsString()
  @IsOptional()
  description?: string;

  /** When the watch becomes relevant — bevakningsdatum (yyyy-MM-dd). */
  @IsString()
  startDate!: string;

  /** When the watch ends — open-ended when omitted (yyyy-MM-dd). */
  @IsString()
  @IsOptional()
  endDate?: string;
}
