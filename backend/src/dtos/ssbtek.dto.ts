import { IsOptional, IsString, Matches } from 'class-validator';

/**
 * The period to read SSBTEK for. Without dates careM reads the SSBTEK rule periods, month M−2 through the current
 * month. The household's members are never named by the caller: careM resolves them from the errand, so no
 * personnummer ends up in a URL (or the request log).
 */
export class SsbtekPeriodQueryDto {
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
