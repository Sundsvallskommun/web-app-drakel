import { describe, expect, it } from 'vitest';

import { formatApplicationMonth, formatPeriodMonth } from './application-month';

describe('formatApplicationMonth', () => {
  it('writes the month name and year in Swedish by default, English on request', () => {
    expect(formatApplicationMonth('2026-06-01')).toBe('Juni 2026');
    expect(formatApplicationMonth('2026-06-01', 'en')).toBe('June 2026');
  });
});

describe('formatPeriodMonth', () => {
  it('formats a month number and year the same way', () => {
    expect(formatPeriodMonth(1, 2026, 'sv')).toBe('Januari 2026');
    expect(formatPeriodMonth(12, 2026, 'en')).toBe('December 2026');
  });

  it('is empty when a part is missing or out of range', () => {
    expect(formatPeriodMonth(undefined, 2026, 'sv')).toBe('');
    expect(formatPeriodMonth(13, 2026, 'sv')).toBe('');
    expect(formatPeriodMonth(6, undefined, 'sv')).toBe('');
  });
});
