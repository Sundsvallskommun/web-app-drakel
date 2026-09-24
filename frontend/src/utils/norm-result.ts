import { LifecareCalculationSummaryView } from '@data-contracts/backend/data-contracts';

/** The sums a normberäkning's result is made of. */
export interface NormResultParts {
  incomeSum?: number;
  normSum?: number;
  expenseSum?: number;
  specialExpenseSum?: number;
}

/** Lifecare's breakdown of the incomes and the norm, when the result comes from a beräkning saved there. */
interface NormResultDetails {
  jobStimulus: number;
  jobStimulusDeduction: number;
  familyCost: number;
  commonHouseholdCost: number;
}

/** A normberäkning's result, counted the way Lifecare's Summering counts it. */
export interface NormResult {
  income: number;
  norm: number;
  expenses: number;
  /** Inkomster − norm − utgifter. */
  sum: number;
  specialExpenses: number;
  /** Summa − levnadskostnader i övrigt: positive is a normöverskott, negative a normunderskott. */
  result: number;
  details?: NormResultDetails;
}

/**
 * The result of a normberäkning in Lifecare's own arithmetic: inkomster less norm and utgifter make the
 * summa, and the levnadskostnader i övrigt come off that. Undefined without a norm, since there is then
 * nothing to measure the incomes against.
 */
export const computeNormResult = (parts: NormResultParts): NormResult | undefined => {
  if (parts.normSum == null) {
    return undefined;
  }
  const income = parts.incomeSum ?? 0;
  const norm = parts.normSum;
  const expenses = parts.expenseSum ?? 0;
  const specialExpenses = parts.specialExpenseSum ?? 0;
  const sum = income - norm - expenses;
  return { income, norm, expenses, sum, specialExpenses, result: sum - specialExpenses };
};

/** Whether the result is a normöverskott (incomes cover the norm) rather than a normunderskott. */
export const isSurplus = (result: NormResult): boolean => result.result >= 0;

/** Lifecare's own summering of a saved beräkning, as the tabs show a result. */
export const fromLifecareSummary = (summary: LifecareCalculationSummaryView): NormResult => ({
  income: summary.income,
  norm: summary.norm,
  expenses: summary.expenses,
  sum: summary.sum,
  specialExpenses: summary.specialExpenses,
  result: summary.result,
  details: {
    jobStimulus: summary.jobStimulus,
    jobStimulusDeduction: summary.jobStimulusDeduction,
    familyCost: summary.familyCost,
    commonHouseholdCost: summary.commonHouseholdCost,
  },
});
