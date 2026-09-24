import { IsOptional, IsString, Matches } from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A new jobbstimulans period for the sökande, written straight to the insats in Lifecare. */
export class AddJobStimulusPeriodDto {
  /** Period start, `YYYY-MM-DD`. */
  @IsString()
  @Matches(DATE_PATTERN, { message: 'fromDate must be YYYY-MM-DD' })
  fromDate!: string;

  /** Period end, `YYYY-MM-DD`; left out, Lifecare's two-year rule sets it. */
  @IsString()
  @Matches(DATE_PATTERN, { message: 'toDate must be YYYY-MM-DD' })
  @IsOptional()
  toDate?: string;
}
