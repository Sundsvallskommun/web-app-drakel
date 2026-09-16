import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';

/** A jobbstimulans period on an errand, mirrored out of Lifecare. */
export class JobStimulusPeriod {
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
