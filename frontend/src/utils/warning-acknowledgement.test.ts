import { describe, expect, it } from 'vitest';

import { isAcknowledgeable } from './warning-acknowledgement';

describe('isAcknowledgeable', () => {
  it('does not offer acknowledgement for the SSBTEK read failure', () => {
    // caremanagement closes it when a later read succeeds; acknowledging would only hide it until then.
    expect(isAcknowledgeable({ type: 'SSBTEK_READ_FAILED' })).toBe(false);
  });

  it('offers acknowledgement for an ordinary income warning', () => {
    expect(isAcknowledgeable({ type: 'UNHANDLED_INCOME' })).toBe(true);
  });

  it('offers acknowledgement for a type it has never seen', () => {
    // A new type is acknowledgeable until someone says otherwise — hiding the action by default
    // would silently strip a handläggare's only way to clear it.
    expect(isAcknowledgeable({ type: 'SOMETHING_NEW' })).toBe(true);
  });

  it('offers acknowledgement when the type is missing', () => {
    expect(isAcknowledgeable({})).toBe(true);
  });
});
