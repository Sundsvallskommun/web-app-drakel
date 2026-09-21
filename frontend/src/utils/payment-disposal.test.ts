import { describe, expect, it } from 'vitest';

import { paymentDisposal } from './payment-disposal';

describe('paymentDisposal', () => {
  it('subtracts the registered payments from the decided amount', () => {
    expect(
      paymentDisposal(10000, [
        { amount: 4000, status: 'EFFECTUATED' },
        { amount: 1000, status: 'QUEUED' },
      ])
    ).toEqual({ decided: 10000, committed: 5000, remaining: 5000 });
  });

  it('counts a draft as committed — the money is already set aside', () => {
    expect(paymentDisposal(10000, [{ amount: 2500, status: 'DRAFT' }]).remaining).toBe(7500);
  });

  it('frees the amount of a payment that failed', () => {
    expect(paymentDisposal(10000, [{ amount: 2500, status: 'FAILED' }]).remaining).toBe(10000);
  });

  it('treats a missing decision as nothing decided', () => {
    expect(paymentDisposal(undefined, [{ amount: 500, status: 'DRAFT' }])).toEqual({
      decided: 0,
      committed: 500,
      remaining: -500,
    });
  });

  it('reports the whole amount when nothing is registered', () => {
    expect(paymentDisposal(8450, [])).toEqual({ decided: 8450, committed: 0, remaining: 8450 });
  });
});
