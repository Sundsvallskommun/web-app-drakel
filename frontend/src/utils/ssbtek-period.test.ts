import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { defaultSsbtekMonths, periodOfMonths, recentMonths } from './ssbtek-period';

const today = dayjs('2026-09-25');

describe('ssbtek-period', () => {
  it('starts from the SSBTEK rule periods: month M−2 through the current month', () => {
    expect(defaultSsbtekMonths(today)).toEqual({ fromMonth: '2026-07', toMonth: '2026-09' });
  });

  it('offers the current month and the months before it, newest first', () => {
    expect(recentMonths(3, today)).toEqual(['2026-09', '2026-08', '2026-07']);
  });

  it('turns the picked months into whole-month dates, whichever way round they were picked', () => {
    expect(periodOfMonths({ fromMonth: '2026-07', toMonth: '2026-09' })).toEqual({
      from: '2026-07-01',
      to: '2026-09-30',
    });
    expect(periodOfMonths({ fromMonth: '2026-02', toMonth: '2025-12' })).toEqual({
      from: '2025-12-01',
      to: '2026-02-28',
    });
  });
});
