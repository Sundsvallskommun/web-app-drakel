// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { constantTimeEquals } from './constant-time-equals';

describe('constantTimeEquals', () => {
  it('accepts an identical value', () => {
    expect(constantTimeEquals('Basic dXNlcjpwYXNz', 'Basic dXNlcjpwYXNz')).toBe(true);
  });

  it('refuses a different value, also one of another length', () => {
    expect(constantTimeEquals('Basic dXNlcjpwYXNx', 'Basic dXNlcjpwYXNz')).toBe(false);
    expect(constantTimeEquals('', 'Basic dXNlcjpwYXNz')).toBe(false);
    expect(constantTimeEquals('Basic dXNlcjpwYXNzLONGER', 'Basic dXNlcjpwYXNz')).toBe(false);
  });
});
