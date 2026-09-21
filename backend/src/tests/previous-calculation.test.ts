import { pickPreviousCalculation } from '@utils/previous-calculation';
import { describe, expect, it } from 'vitest';

import { LifecareCalculation } from '@/data-contracts/caremanagement/data-contracts';

const calculation = (id: number, fromDate?: string): LifecareCalculation => ({ id, fromDate });

describe('pickPreviousCalculation', () => {
  it('picks the latest calculation that starts before the draft period', () => {
    const calculations = [calculation(1, '2026-05-01'), calculation(2, '2026-07-01'), calculation(3, '2026-06-01')];

    expect(pickPreviousCalculation(calculations, '2026-07-01')?.id).toBe(3);
  });

  it('ignores calculations starting on or after the draft period', () => {
    const calculations = [calculation(1, '2026-07-01'), calculation(2, '2026-08-01')];

    expect(pickPreviousCalculation(calculations, '2026-07-01')).toBeUndefined();
  });

  it('falls back to the most recent calculation when the draft has no start date', () => {
    const calculations = [calculation(1, '2026-05-01'), calculation(2, '2026-08-01')];

    expect(pickPreviousCalculation(calculations, undefined)?.id).toBe(2);
  });

  it('skips calculations without a start date rather than ordering them arbitrarily', () => {
    const calculations = [calculation(1), calculation(2, '2026-05-01')];

    expect(pickPreviousCalculation(calculations, '2026-07-01')?.id).toBe(2);
  });

  it('returns undefined for an empty list', () => {
    expect(pickPreviousCalculation([], '2026-07-01')).toBeUndefined();
  });
});
