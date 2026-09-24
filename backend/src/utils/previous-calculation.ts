import { LifecareCalculationListItemRaw } from '@interfaces/lifecare-calculation.interface';

/** Newer first: a later period, then — within the same period — a slutlig one, then the one made last. */
const newerFirst = (first: LifecareCalculationListItemRaw, second: LifecareCalculationListItemRaw): number =>
  second.startDate.localeCompare(first.startDate) ||
  Number(second.isFinalized) - Number(first.isFinalized) ||
  second.calculationId - first.calculationId;

/**
 * Picks the beräkning preceding the errand's own period from the insats's list in Lifecare: of those starting
 * before `periodStart`, the latest period — within it a slutlig one before one still being worked on, then
 * the newest. The errand's own beräkning is never its own predecessor. Without a period start the most recent
 * other beräkning is taken.
 */
export const pickPreviousCalculation = (
  calculations: LifecareCalculationListItemRaw[],
  periodStart: string | undefined,
  ownCalculationId: number | undefined,
): LifecareCalculationListItemRaw | undefined =>
  calculations
    .filter(calculation => calculation.calculationId !== ownCalculationId && calculation.startDate !== '')
    .filter(calculation => !periodStart || calculation.startDate < periodStart)
    .sort(newerFirst)[0];
