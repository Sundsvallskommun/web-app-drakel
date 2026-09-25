import { buildFinalizeRequest } from '@utils/finalize-request';
import { describe, expect, it } from 'vitest';

describe('buildFinalizeRequest', () => {
  it('sends the chosen channels and the household-size flag, and no decision for careM to read from Lifecare', () => {
    const request = buildFinalizeRequest({ minaSidor: true, meddelande: true, brev: true }, true);

    expect(request).toEqual({
      communication: { minaSidor: true, digitalMailbox: false, letter: true },
      householdSizeChanged: true,
    });
    expect(request).not.toHaveProperty('decision');
    // The Utbetalning tab registers utbetalningar in Lifecare directly; careM gets none.
    expect(request).not.toHaveProperty('payments');
  });

  it('leaves out every channel the handläggare did not choose', () => {
    expect(buildFinalizeRequest({}, false)).toEqual({
      communication: { minaSidor: false, digitalMailbox: false, letter: false },
      householdSizeChanged: false,
    });
  });
});
