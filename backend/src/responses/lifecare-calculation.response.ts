import { ApiResponse } from '@interfaces/api-service.interface';
import { LifecareCalculationRaw } from '@interfaces/lifecare-calculation.interface';
import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

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

/** The saved beräkning, cleaned up for the tabs. The household and its personnummer are left behind. */
export const toLifecareCalculationView = (calculation: LifecareCalculationRaw): LifecareCalculationView => {
  const summary = calculation.calculationSummary;
  return {
    id: calculation.calculationId,
    normName: calculation.normText ?? undefined,
    date: calculation.date,
    startDate: calculation.startDate,
    endDate: calculation.endDate,
    finalized: calculation.isFinalized,
    updated: calculation.updateTimestamp,
    summary: summary
      ? {
          income: summary.income,
          jobStimulus: summary.jobStimulus,
          jobStimulusDeduction: summary.jobStimulusDeduction,
          // Lifecare signs what reduces the result negative; the view carries it as an amount.
          norm: -summary.norm,
          familyCost: summary.familyCost,
          commonHouseholdCost: summary.commonHouseholdCost,
          expenses: -summary.expences,
          sum: summary.sum,
          specialExpenses: summary.specialPurpose,
          result: summary.balance,
        }
      : undefined,
  };
};
