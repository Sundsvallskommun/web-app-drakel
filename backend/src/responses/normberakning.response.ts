import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * The normberäkning draft mirrors the Lifecare FC "Beräkning" view: one income row per type (with an
 * applicant (S) and co-applicant (M) side), expenses split into EXPENSE / SPECIAL_EXPENSE buckets, the
 * covered persons, and a header (norm + dates + household size). Each value comes in three flavours:
 * a read-only process value (system), an editable handläggare value, and the resulting effective value.
 */
export class NormPersonRow {
  @IsString() @IsOptional() id?: string;
  @IsString() @IsOptional() origin?: string;
  @IsString() @IsOptional() partyId?: string;
  @IsString() @IsOptional() role?: string;
  @IsString() @IsOptional() name?: string;
  @IsInt() @IsOptional() processDays?: number;
  @IsInt() @IsOptional() caseworkerDays?: number;
  @IsInt() @IsOptional() effectiveDays?: number;
  @IsBoolean() @IsOptional() included?: boolean;
  @IsString() @IsOptional() deviationFromDate?: string;
  @IsString() @IsOptional() deviationToDate?: string;
  @IsString() @IsOptional() normInterval?: string;
  @IsNumber() @IsOptional() jobStimulusAmount?: number;
  @IsBoolean() @IsOptional() deleted?: boolean;
  @IsString() @IsOptional() note?: string;
}

export class NormIncomeRow {
  @IsString() @IsOptional() id?: string;
  @IsString() @IsOptional() origin?: string;
  @IsInt() @IsOptional() typeId?: number;
  @IsString() @IsOptional() typeName?: string;
  @IsNumber() @IsOptional() applicantProcessAmount?: number;
  @IsNumber() @IsOptional() applicantCaseworkerAmount?: number;
  @IsNumber() @IsOptional() applicantEffectiveAmount?: number;
  @IsString() @IsOptional() applicantAmountDate?: string;
  @IsNumber() @IsOptional() coapplicantProcessAmount?: number;
  @IsNumber() @IsOptional() coapplicantCaseworkerAmount?: number;
  @IsNumber() @IsOptional() coapplicantEffectiveAmount?: number;
  @IsString() @IsOptional() coapplicantAmountDate?: string;
  @IsBoolean() @IsOptional() deleted?: boolean;
  @IsString() @IsOptional() note?: string;
}

export class NormExpenseRow {
  @IsString() @IsOptional() id?: string;
  @IsString() @IsOptional() origin?: string;
  /** EXPENSE or SPECIAL_EXPENSE (set by the DMN). */
  @IsString() @IsOptional() bucket?: string;
  @IsString() @IsOptional() costType?: string;
  @IsString() @IsOptional() otherSubType?: string;
  @IsString() @IsOptional() specification?: string;
  @IsNumber() @IsOptional() appliedAmount?: number;
  @IsNumber() @IsOptional() processAmount?: number;
  @IsNumber() @IsOptional() caseworkerAmount?: number;
  @IsNumber() @IsOptional() effectiveAmount?: number;
  @IsBoolean() @IsOptional() deleted?: boolean;
  @IsString() @IsOptional() note?: string;
}

export class NormberakningDraft {
  @IsString() @IsOptional() errandId?: string;
  @IsString() @IsOptional() applicationMonth?: string;
  @IsInt() @IsOptional() normId?: number;
  @IsString() @IsOptional() normType?: string;
  @IsString() @IsOptional() calculationFromDate?: string;
  @IsString() @IsOptional() calculationToDate?: string;
  @IsString() @IsOptional() calculationDate?: string;
  @IsBoolean() @IsOptional() hasCustomHouseholdSize?: boolean;
  @IsInt() @IsOptional() householdSize?: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormPersonRow) @IsOptional() persons?: NormPersonRow[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormIncomeRow) @IsOptional() incomes?: NormIncomeRow[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormExpenseRow) @IsOptional() expenses?: NormExpenseRow[];
  @IsArray() @ValidateNested({ each: true }) @Type(() => NormExpenseRow) @IsOptional() specialExpenses?: NormExpenseRow[];
  @IsNumber() @IsOptional() incomeSum?: number;
  @IsNumber() @IsOptional() expenseSum?: number;
  @IsNumber() @IsOptional() specialExpenseSum?: number;
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
