import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * The normberäkning draft has three sections (persons · incomes · expenses). Each row carries a
 * read-only process value (set by the system), an editable handläggare value, and the resulting
 * effective value (handläggare value when set, otherwise the process value).
 */
export class NormPersonRow {
  @IsString() @IsOptional() id?: string;
  /** SYSTEM or HANDLAGGARE. */
  @IsString() @IsOptional() origin?: string;
  @IsString() @IsOptional() partyId?: string;
  /** APPLICANT, CO_APPLICANT or CHILD. */
  @IsString() @IsOptional() role?: string;
  @IsString() @IsOptional() name?: string;
  @IsInt() @IsOptional() processDays?: number;
  @IsInt() @IsOptional() handlaggareDays?: number;
  @IsInt() @IsOptional() effectiveDays?: number;
  @IsBoolean() @IsOptional() deleted?: boolean;
  @IsString() @IsOptional() note?: string;
}

export class NormIncomeRow {
  @IsString() @IsOptional() id?: string;
  @IsString() @IsOptional() origin?: string;
  @IsInt() @IsOptional() typeId?: number;
  @IsString() @IsOptional() typeName?: string;
  /** APPLICANT or CO_APPLICANT. */
  @IsString() @IsOptional() recipient?: string;
  @IsNumber() @IsOptional() processAmount?: number;
  @IsString() @IsOptional() processAmountDate?: string;
  @IsNumber() @IsOptional() handlaggareAmount?: number;
  @IsString() @IsOptional() handlaggareAmountDate?: string;
  @IsNumber() @IsOptional() effectiveAmount?: number;
  @IsBoolean() @IsOptional() deleted?: boolean;
  @IsString() @IsOptional() note?: string;
}

export class NormExpenseRow {
  @IsString() @IsOptional() id?: string;
  @IsString() @IsOptional() origin?: string;
  @IsString() @IsOptional() costType?: string;
  @IsString() @IsOptional() otherSubType?: string;
  @IsString() @IsOptional() specification?: string;
  @IsNumber() @IsOptional() appliedAmount?: number;
  @IsNumber() @IsOptional() processAmount?: number;
  @IsNumber() @IsOptional() handlaggareAmount?: number;
  @IsNumber() @IsOptional() effectiveAmount?: number;
  @IsBoolean() @IsOptional() deleted?: boolean;
  @IsString() @IsOptional() note?: string;
}

/** The editable draft normberäkning — three sections plus the system-computed sums. */
export class NormberakningDraft {
  @IsString() @IsOptional() errandId?: string;
  @IsString() @IsOptional() applicationMonth?: string;
  @IsInt() @IsOptional() normId?: number;
  @IsString() @IsOptional() normType?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormPersonRow) @IsOptional() persons?: NormPersonRow[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormIncomeRow) @IsOptional() incomes?: NormIncomeRow[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormExpenseRow) @IsOptional() expenses?: NormExpenseRow[];
  @IsNumber() @IsOptional() incomeSum?: number;
  @IsNumber() @IsOptional() expenseSum?: number;
  @IsString() @IsOptional() created?: string;
  @IsString() @IsOptional() updated?: string;
}

export class NormberakningDraftApiResponse implements ApiResponse<NormberakningDraft> {
  @ValidateNested()
  @Type(() => NormberakningDraft)
  data!: NormberakningDraft;
  @IsString()
  message!: string;
}
