import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * A committed Lifecare calculation, surfaced next to the errand's own draft so the handläggare can
 * compare against the previous period. Read-only throughout — Lifecare owns these rows, and nothing
 * here can be edited from Draken. careM's NormberakningPreviousCalculation has this very shape and is
 * passed through as it is.
 */
export class PreviousCalculationPerson {
  @IsString() @IsOptional() name?: string;
  @IsNumber() @IsOptional() amount?: number;
  @IsString() @IsOptional() deviationFromDate?: string;
  @IsString() @IsOptional() deviationToDate?: string;
}

export class PreviousCalculationIncome {
  @IsString() @IsOptional() type?: string;
  @IsNumber() @IsOptional() amountApplicant?: number;
  @IsString() @IsOptional() applicantSearchDate?: string;
  @IsNumber() @IsOptional() amountCoApplicant?: number;
  @IsString() @IsOptional() coApplicantSearchDate?: string;
}

export class PreviousCalculationExpense {
  @IsString() @IsOptional() type?: string;
  @IsNumber() @IsOptional() appliedAmount?: number;
  @IsNumber() @IsOptional() approvedAmount?: number;
}

export class PreviousCalculationView {
  @IsInt() @IsOptional() id?: number;
  @IsString() @IsOptional() norm?: string;
  @IsString() @IsOptional() fromDate?: string;
  @IsString() @IsOptional() toDate?: string;
  @IsNumber() @IsOptional() incomeSum?: number;
  @IsNumber() @IsOptional() expenseSum?: number;
  @IsNumber() @IsOptional() specialExpenseSum?: number;
  @IsNumber() @IsOptional() normSum?: number;
  @IsNumber() @IsOptional() commonHouseholdCost?: number;
  @IsNumber() @IsOptional() familyCost?: number;
  @IsNumber() @IsOptional() balance?: number;
  @IsNumber() @IsOptional() totalSum?: number;
  @IsBoolean() @IsOptional() isFinal?: boolean;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviousCalculationPerson)
  @IsOptional()
  persons?: PreviousCalculationPerson[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviousCalculationIncome)
  @IsOptional()
  incomes?: PreviousCalculationIncome[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviousCalculationExpense)
  @IsOptional()
  expenses?: PreviousCalculationExpense[];
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviousCalculationExpense)
  @IsOptional()
  specialExpenses?: PreviousCalculationExpense[];
}

/** `data` is null when the applicant has no earlier Lifecare calculation — a normal state, not an error. */
export class PreviousCalculationApiResponse implements ApiResponse<PreviousCalculationView | null> {
  @ValidateNested()
  @Type(() => PreviousCalculationView)
  @IsOptional()
  data!: PreviousCalculationView | null;
  @IsString() message!: string;
}
