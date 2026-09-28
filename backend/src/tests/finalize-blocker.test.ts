import { finalizeBlocker } from '@utils/finalize-blocker';
import { describe, expect, it } from 'vitest';

const allDone = { calculationFinalized: true, decisionSaved: true, paymentRegistered: true };

describe('finalizeBlocker', () => {
  it('lets the send through when the beräkning is slutlig, the beslut saved and the utbetalning registered', () => {
    expect(finalizeBlocker(allDone, 'BIFALL')).toBeUndefined();
  });

  it('holds the send until the beräkning is saved as slutlig, which careM does not check', () => {
    expect(finalizeBlocker({ ...allDone, calculationFinalized: false }, 'BIFALL')).toBe(
      'Spara normberäkningen som slutlig innan du skickar beräkning och beslut.',
    );
  });

  it('holds the send until the beslut is saved', () => {
    expect(finalizeBlocker({ ...allDone, decisionSaved: false }, undefined)).toBe('Spara beslutet innan du skickar beräkning och beslut.');
  });

  it('holds a beslut that grants something until the utbetalning is registered', () => {
    expect(finalizeBlocker({ ...allDone, paymentRegistered: false }, 'BIFALL')).toBe(
      'Registrera utbetalningen innan du skickar beräkning och beslut.',
    );
  });

  it('lets an avslag through without an utbetalning', () => {
    expect(finalizeBlocker({ ...allDone, paymentRegistered: false }, 'AVSLAG')).toBeUndefined();
  });
});
