import { formatOrgNr, isEmpty, isValidUrl, luhnCheck } from '@utils/util';
import { describe, expect, it } from 'vitest';

describe('isEmpty', () => {
  it('treats empty string and empty object as empty', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty({})).toBe(true);
  });

  it('treats non-empty values as non-empty', () => {
    expect(isEmpty('x')).toBe(false);
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});

describe('luhnCheck', () => {
  it('accepts a Luhn-valid number', () => {
    expect(luhnCheck('2120002411')).toBe(true);
  });

  it('rejects a Luhn-invalid number', () => {
    expect(luhnCheck('1234567890')).toBe(false);
  });
});

describe('formatOrgNr', () => {
  it('formats a valid 10-digit org number with a dash', () => {
    expect(formatOrgNr('2120002411')).toBe('212000-2411');
  });

  it('returns undefined for an invalid org number', () => {
    expect(formatOrgNr('123')).toBeUndefined();
  });
});

describe('isValidUrl', () => {
  it('accepts http(s) URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('rejects non-URLs', () => {
    expect(isValidUrl('not a url')).toBe(false);
  });
});
