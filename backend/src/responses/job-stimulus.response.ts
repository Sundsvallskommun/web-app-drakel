import { ApiResponse } from '@interfaces/api-service.interface';
import { LifecareJobStimulusPeriodRaw, LifecareJobStimulusRaw } from '@interfaces/lifecare-job-stimulus.interface';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/** A jobbstimulans period on the errand's insats, as Lifecare holds it. The personnummer is left behind. */
export class JobStimulusPeriod {
  /** Lifecare's jobStimulusId. */
  @IsNumber()
  @IsOptional()
  id?: number;
  /** Whose period it is: APPLICANT or CO_APPLICANT. */
  @IsString()
  @IsOptional()
  role?: string;
  /** Period start (YYYY-MM-DD). */
  @IsString()
  @IsOptional()
  fromDate?: string;
  /** Period end (YYYY-MM-DD); absent for an open-ended period. */
  @IsString()
  @IsOptional()
  toDate?: string;
}

export class JobStimulusPeriodsApiResponse implements ApiResponse<JobStimulusPeriod[]> {
  @ValidateNested({ each: true })
  @Type(() => JobStimulusPeriod)
  data!: JobStimulusPeriod[];
  @IsString()
  message!: string;
}

const toPeriod = (period: LifecareJobStimulusPeriodRaw, role: string): JobStimulusPeriod => ({
  id: period.jobStimulusId,
  role,
  fromDate: period.fromDate || undefined,
  // Lifecare sends an empty string for a period without an end.
  toDate: period.toDate || undefined,
});

/** The sökandes and the medsökandes periods, each marked with whose it is. Removed periods are left out. */
export const toJobStimulusPeriods = (raw: LifecareJobStimulusRaw): JobStimulusPeriod[] => [
  ...(raw.applicant?.periods ?? []).filter(period => !period.markedForRemoval).map(period => toPeriod(period, 'APPLICANT')),
  ...(raw.coApplicant?.periods ?? []).filter(period => !period.markedForRemoval).map(period => toPeriod(period, 'CO_APPLICANT')),
];
