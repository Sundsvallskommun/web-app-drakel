import { describe, expect, it } from 'vitest';

import { combineDateAndTime, formatDateTime, splitDateTime } from './date-time';

// The offset depends on the machine's timezone, so the assertions pin the date/time parts and accept
// any valid offset — keeping the tests green in CI (UTC) as well as locally (Europe/Stockholm).
const ISO_OFFSET = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

describe('combineDateAndTime', () => {
  it('combines the date and time pickers into one ISO offset date-time', () => {
    const combined = combineDateAndTime('2025-05-30', '14:30');
    expect(combined).toMatch(ISO_OFFSET);
    expect(combined.startsWith('2025-05-30T14:30:00')).toBe(true);
  });

  it('falls back to midnight when the optional time picker is left empty', () => {
    expect(combineDateAndTime('2025-05-30').startsWith('2025-05-30T00:00:00')).toBe(true);
    expect(combineDateAndTime('2025-05-30', '').startsWith('2025-05-30T00:00:00')).toBe(true);
  });
});

describe('splitDateTime', () => {
  it('splits an ISO offset date-time back into the picker values', () => {
    expect(splitDateTime(combineDateAndTime('2025-05-30', '14:30'))).toEqual({ date: '2025-05-30', time: '14:30' });
  });

  it('returns empty parts when the value is missing or unparsable', () => {
    expect(splitDateTime()).toEqual({ date: '', time: '' });
    expect(splitDateTime('inte ett datum')).toEqual({ date: '', time: '' });
  });
});

describe('formatDateTime', () => {
  it('formats an ISO date-time for display', () => {
    expect(formatDateTime(combineDateAndTime('2025-05-30', '14:30'))).toBe('2025-05-30 14:30');
  });

  it('returns an empty string when the value is missing or unparsable', () => {
    expect(formatDateTime()).toBe('');
    expect(formatDateTime('inte ett datum')).toBe('');
  });
});
