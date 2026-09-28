import { describe, expect, it } from 'vitest';

import { buildErrandPatch } from './errand-patch';

const LOADED = { assignedUserId: 'abc01def', status: 'ONGOING' };

describe('buildErrandPatch', () => {
  it('is empty when nothing changed, so no PATCH is sent', () => {
    expect(buildErrandPatch({ ...LOADED }, LOADED)).toEqual({});
  });

  it('sends only the fields that differ from the loaded errand', () => {
    expect(buildErrandPatch({ ...LOADED, status: 'WAITING' }, LOADED)).toEqual({ status: 'WAITING' });
    expect(buildErrandPatch({ assignedUserId: 'xyz99abc', status: 'WAITING' }, LOADED)).toEqual({
      assignedUserId: 'xyz99abc',
      status: 'WAITING',
    });
  });

  it('leaves out a field emptied in the form', () => {
    expect(buildErrandPatch({ ...LOADED, assignedUserId: '' }, LOADED)).toEqual({});
  });
});
