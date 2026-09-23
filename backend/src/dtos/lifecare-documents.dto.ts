import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

/**
 * The edits a handläggare makes to a Lifecare journalanteckning or document.
 *
 * Only these three fields are the caller's to change; everything else on the Lifecare object is
 * round-tripped untouched (see {@link LifecareDocumentsService}). The date and time are Lifecare's
 * own field shapes — a plain `YYYY-MM-DD` date and `HH:mm` time, not an ISO offset date-time.
 */
export class UpdateLifecareRecordDto {
  /** The record body as HTML, e.g. `<p>…</p>`. */
  @IsString()
  @MaxLength(1048576)
  content!: string;

  /** Documented date, `YYYY-MM-DD`. */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'occurenceDate must be YYYY-MM-DD' })
  @IsOptional()
  occurenceDate?: string;

  /** Documented time, `HH:mm`. */
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'time must be HH:mm' })
  @IsOptional()
  time?: string;
}
