import { describe, expect, it } from 'vitest';

import { formatDateRange } from './date-range';

describe('formatDateRange', () => {
  it('shows both ends of a closed range', () => {
    expect(formatDateRange('2026-01-01', '2026-06-30')).toBe('2026-01-01 – 2026-06-30');
  });

  it('shows an open-ended range from its start', () => {
    expect(formatDateRange('2026-01-01')).toBe('Från 2026-01-01');
  });

  it('falls back to a dash without a start', () => {
    expect(formatDateRange(undefined, '2026-06-30')).toBe('—');
  });
});
