import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/** A beslut recorded on an errand (the audit trail of every decision made on the case). */
export class Decision {
  @IsString()
  @IsOptional()
  id?: string;
  /** Decision category — RECOMMENDATION (automated suggestion) or PAYMENT (handläggare beslut). */
  @IsString()
  @IsOptional()
  decisionType?: string;
  /** Decision value — the chosen DecisionOption code (or APPROVED/REJECTED). */
  @IsString()
  @IsOptional()
  value?: string;
  /** Internal motivation for the decision. */
  @IsString()
  @IsOptional()
  description?: string;
  /** Granted belopp in SEK (0 for an avslag); the recommended amount for a RECOMMENDATION. */
  @IsNumber()
  @IsOptional()
  amount?: number;
  /** The beslutsmeddelande communicated to the applicant. */
  @IsString()
  @IsOptional()
  decisionMessage?: string;
  /** The handläggare-chosen beslutsdatum. */
  @IsString()
  @IsOptional()
  decisionDate?: string;
  /** Start of the period the decision covers. */
  @IsString()
  @IsOptional()
  periodFrom?: string;
  /** End of the period the decision covers. */
  @IsString()
  @IsOptional()
  periodTo?: string;
  @IsString()
  @IsOptional()
  createdBy?: string;
  @IsString()
  @IsOptional()
  created?: string;
}

/** An allowed beslutsalternativ (decision outcome) for an errand type. */
export class DecisionOption {
  @IsString()
  @IsOptional()
  code?: string;
  @IsString()
  @IsOptional()
  displayName?: string;
  /** True for outcomes that grant a belopp; false for ones that imply 0 (e.g. avslag). */
  @IsBoolean()
  @IsOptional()
  carriesAmount?: boolean;
}

export class DecisionsApiResponse implements ApiResponse<Decision[]> {
  @ValidateNested({ each: true })
  @Type(() => Decision)
  data!: Decision[];
  @IsString()
  message!: string;
}

export class DecisionApiResponse implements ApiResponse<Decision> {
  @ValidateNested()
  @Type(() => Decision)
  data!: Decision;
  @IsString()
  message!: string;
}

export class DecisionOptionsApiResponse implements ApiResponse<DecisionOption[]> {
  @ValidateNested({ each: true })
  @Type(() => DecisionOption)
  data!: DecisionOption[];
  @IsString()
  message!: string;
}

export class RecommendationApiResponse implements ApiResponse<Decision | null> {
  @ValidateNested()
  @Type(() => Decision)
  @IsOptional()
  data!: Decision | null;
  @IsString()
  message!: string;
}
