import { LifecareCalculationListItemRaw } from '@interfaces/lifecare-calculation.interface';
import { pickPreviousCalculation } from '@utils/previous-calculation';
import { describe, expect, it } from 'vitest';

const listed = (calculationId: number, startDate: string, isFinalized: boolean): LifecareCalculationListItemRaw => ({
  calculationId,
  date: '2026-09-23',
  startDate,
  endDate: '',
  isFinalized,
});

/** Calculation/ListCalculations for insats 1 (capture 2026-09-24), newest first. */
const insats = [
  listed(31, '2026-09-01', true),
  listed(30, '2026-10-01', true),
  listed(29, '2026-12-01', false),
  listed(28, '2026-11-01', false),
  listed(12, '2026-09-01', true),
  listed(5, '2026-10-01', true),
  listed(2, '2026-05-01', true),
  listed(1, '2026-01-01', false),
];

const previousId = (periodStart: string | undefined, own?: number): number | undefined =>
  pickPreviousCalculation(insats, periodStart, own)?.calculationId;

describe('pickPreviousCalculation', () => {
  it('picks the latest period before the errand’s own', () => {
    expect(previousId('2026-12-01', 29)).toBe(28);
    expect(previousId('2026-09-01', 31)).toBe(2);
  });

  it('prefers the newest of several beräkningar for the same period', () => {
    expect(previousId('2026-10-01', 30)).toBe(31);
  });

  it('prefers a slutlig beräkning over one still being worked on in the same period', () => {
    const samePeriod = [listed(40, '2026-08-01', false), listed(39, '2026-08-01', true)];

    expect(pickPreviousCalculation(samePeriod, '2026-09-01', undefined)?.calculationId).toBe(39);
  });

  it('never takes the errand’s own beräkning, and takes the most recent other one without a period', () => {
    expect(previousId(undefined, 29)).toBe(28);
  });

  it('has nothing before the first period', () => {
    expect(previousId('2026-01-01')).toBeUndefined();
  });
});
