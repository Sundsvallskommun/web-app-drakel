import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

/** Whose SSBTEK basis to read: the errand's sökande or medsökande. careM resolves the person from the errand. */
export const SSBTEK_PERSONS = ['APPLICANT', 'CO_APPLICANT'] as const;

/**
 * Which SSBTEK basis to read for an errand. Only the person's role is sent — never a personnummer, which careM
 * looks up itself, so none ends up in a URL (or the request log). Without dates careM reads the SSBTEK rule
 * periods, month M−2 through the current month.
 */
export class SsbtekQueryDto {
  @IsOptional()
  @IsIn(SSBTEK_PERSONS)
  person?: (typeof SSBTEK_PERSONS)[number];

  /** Inclusive start of the period, `yyyy-MM-dd`. */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'from must be yyyy-MM-dd' })
  from?: string;

  /** Inclusive end of the period, `yyyy-MM-dd`. */
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'to must be yyyy-MM-dd' })
  to?: string;
}
