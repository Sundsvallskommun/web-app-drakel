/** The sums a normberäkning's result is made of. */
export interface NormResultParts {
  incomeSum?: number;
  normSum?: number;
  expenseSum?: number;
  specialExpenseSum?: number;
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
