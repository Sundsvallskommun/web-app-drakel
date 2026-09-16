import { isValidUrl } from '@utils/util';
import { describe, expect, it } from 'vitest';

describe('isValidUrl', () => {
  it('accepts http(s) URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('rejects non-URLs', () => {
    expect(isValidUrl('not a url')).toBe(false);
  });
});
