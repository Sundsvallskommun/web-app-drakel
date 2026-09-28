import { describe, expect, it } from 'vitest';

import { apiPath } from './api-path';

describe('apiPath', () => {
  it('keeps the literal parts and plain ids as they are', () => {
    expect(apiPath`errands/${'PRH-2026-000123'}/notes/${42}`).toBe('errands/PRH-2026-000123/notes/42');
  });

  it('encodes each value as a single segment', () => {
    expect(apiPath`errands/${'../admin?x=1#y'}/notes`).toBe('errands/..%2Fadmin%3Fx%3D1%23y/notes');
    expect(apiPath`admin/templates/${'a b/c'}`).toBe('admin/templates/a%20b%2Fc');
  });

  it('works without any value', () => {
    expect(apiPath`notifications`).toBe('notifications');
  });
});
