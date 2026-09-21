import { LifecareCalculation } from '@/data-contracts/caremanagement/data-contracts';

/**
 * Picks the calculation that precedes the errand's own period: the one with the latest `fromDate`
 * that still starts before `draftFromDate`.
 *
 * caremanagement's `listCalculations` does not specify an order, so the list is sorted here rather
 * than trusted. Without a draft start date there is nothing to be "before", so the most recent
 * calculation is returned instead.
 */
export const pickPreviousCalculation = (calculations: LifecareCalculation[], draftFromDate?: string): LifecareCalculation | undefined => {
  // The type predicate narrows fromDate to a string, so the comparisons below need no assertions.
  const dated = calculations.filter((calculation): calculation is LifecareCalculation & { fromDate: string } => !!calculation.fromDate);
  const candidates = draftFromDate ? dated.filter(calculation => calculation.fromDate < draftFromDate) : dated;

  return candidates.sort((first, second) => (first.fromDate < second.fromDate ? 1 : -1))[0];
};
