import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import { formatShortDateTime } from './format-short-date-time';

describe('formatShortDateTime', () => {
  it('formats a date-time in the current year without the year', () => {
    const currentYearDateTime = dayjs().month(7).date(12).hour(12).minute(12).format();
    expect(formatShortDateTime(currentYearDateTime)).toBe('12 aug, 12:12');
  });

  it('includes the year for a date-time in another year', () => {
    const lastYearDateTime = dayjs().subtract(1, 'year').month(7).date(12).hour(9).minute(5);
    expect(formatShortDateTime(lastYearDateTime.format())).toBe(`12 aug ${lastYearDateTime.year()}, 09:05`);
  });

  it('uses English month names when the language is English', () => {
    const currentYearDateTime = dayjs().month(9).date(3).hour(8).minute(30).format();
    expect(formatShortDateTime(currentYearDateTime, 'en')).toBe('3 Oct, 08:30');
    expect(formatShortDateTime(currentYearDateTime, 'sv')).toBe('3 okt, 08:30');
  });

  it('returns an empty string when the value is missing or unparsable', () => {
    expect(formatShortDateTime()).toBe('');
    expect(formatShortDateTime('inte ett datum')).toBe('');
  });
});
