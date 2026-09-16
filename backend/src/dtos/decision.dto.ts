import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * The fields a handläggare sends when recording a beslut (decision) on an errand. Maps onto the
 * caremanagement Decision: `value` is the chosen DecisionOption code, `amount` the granted belopp
 * (0 for an avslag), and periodFrom/periodTo the month the beslut covers. `decisionType` defaults to
 * PAYMENT (a handläggare decision) when omitted.
 */
export class CreateDecisionDto {
  @IsString()
  @MaxLength(32)
  @IsOptional()
  decisionType?: string;

  /** The chosen beslutsalternativ — the DecisionOption code. */
  @IsString()
  @MaxLength(255)
  value!: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  /** The handläggare-chosen beslutsdatum (YYYY-MM-DD). */
  @IsString()
  @IsOptional()
  decisionDate?: string;

  /** Start of the period the beslut covers (YYYY-MM-DD). */
  @IsString()
  @IsOptional()
  periodFrom?: string;

  /** End of the period the beslut covers (YYYY-MM-DD). */
  @IsString()
  @IsOptional()
  periodTo?: string;

  /** The beslutsmeddelande shown to the applicant. */
  @IsString()
  @MaxLength(8192)
  @IsOptional()
  decisionMessage?: string;

  /** Internal motivation, kept separate from the applicant-facing decisionMessage. */
  @IsString()
  @MaxLength(4096)
  @IsOptional()
  description?: string;
}
