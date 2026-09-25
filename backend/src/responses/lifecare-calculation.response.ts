import { ApiResponse } from '@interfaces/api-service.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import {
  LifecareCalculationSummary as CaremanagementLifecareCalculationSummary,
  LifecareCalculationView as CaremanagementLifecareCalculationView,
} from '@/data-contracts/caremanagement/data-contracts';

/**
 * Lifecare's summering of a beräkning, signed the way the handläggare reads it: amounts that reduce the
 * result (norm, utgifter, levnadskostnader i övrigt) are positive here and subtracted; `result` is the
 * överskott (positive) or underskott (negative).
 */
export class LifecareCalculationSummaryView {
  @IsNumber() income!: number;
  /** Jobbstimulans brutto — the income it is counted on. */
  @IsNumber() jobStimulus!: number;
  /** The part of the income jobbstimulans leaves out. */
  @IsNumber() jobStimulusDeduction!: number;
  @IsNumber() norm!: number;
  /** The norm's part for the members. */
  @IsNumber() familyCost!: number;
  /** The norm's part for the household's gemensamma kostnader. */
  @IsNumber() commonHouseholdCost!: number;
  @IsNumber() expenses!: number;
  /** Inkomster − norm − utgifter. */
  @IsNumber() sum!: number;
  @IsNumber() specialExpenses!: number;
  @IsNumber() result!: number;
}

/** The errand's beräkning as it stands in Lifecare. */
export class LifecareCalculationView {
  /** Lifecare's calculationId. */
  @IsNumber() id!: number;
  @IsString() @IsOptional() normName?: string;
  @IsString() date!: string;
  @IsString() startDate!: string;
  @IsString() endDate!: string;
  /** Saved as slutlig in Lifecare; it can no longer be changed then. */
  @IsBoolean() finalized!: boolean;
  /** When Lifecare last saved it. */
  @IsString() updated!: string;
  @ValidateNested() @Type(() => LifecareCalculationSummaryView) @IsOptional() summary?: LifecareCalculationSummaryView;
}

export class LifecareCalculationApiResponse implements ApiResponse<LifecareCalculationView | null> {
  /** Null while no beräkning has been saved in Lifecare for the errand. */
  @ValidateNested() @Type(() => LifecareCalculationView) @IsOptional() data!: LifecareCalculationView | null;
  @IsString() message!: string;
}

/** careM leaves out an amount Lifecare's summering has none for; the view counts it as 0. */
const amountOrZero = (amount: number | undefined): number => amount ?? 0;

const toSummaryView = (summary: CaremanagementLifecareCalculationSummary): LifecareCalculationSummaryView => ({
  income: amountOrZero(summary.income),
  jobStimulus: amountOrZero(summary.jobStimulus),
  jobStimulusDeduction: amountOrZero(summary.jobStimulusDeduction),
  norm: amountOrZero(summary.norm),
  familyCost: amountOrZero(summary.familyCost),
  commonHouseholdCost: amountOrZero(summary.commonHouseholdCost),
  expenses: amountOrZero(summary.expenses),
  sum: amountOrZero(summary.sum),
  specialExpenses: amountOrZero(summary.specialExpenses),
  result: amountOrZero(summary.result),
});

/**
 * careM's view of the saved beräkning as drakel's. careM already signs the summering the way the handläggare reads
 * it and leaves the household behind; its contract only marks every field optional, where drakel's view requires
 * them — a missing id becomes 0, a missing text empty, a missing flag false.
 */
export const toLifecareCalculationView = (calculation: CaremanagementLifecareCalculationView): LifecareCalculationView => ({
  id: calculation.id ?? 0,
  normName: calculation.normName,
  date: calculation.date ?? '',
  startDate: calculation.startDate ?? '',
  endDate: calculation.endDate ?? '',
  finalized: calculation.finalized ?? false,
  updated: calculation.updated ?? '',
  summary: calculation.summary ? toSummaryView(calculation.summary) : undefined,
});

export class LifecareCalculationPdfApiResponse implements ApiResponse<string> {
  /** The beräkning as Lifecare prints it, a PDF in base64. */
  @IsString() data!: string;
  @IsString() message!: string;
}
