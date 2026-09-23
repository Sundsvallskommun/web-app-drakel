import { describe, expect, it } from 'vitest';

import { finalizeFollowUps } from './finalize-follow-ups';

const clean = {
  paymentIds: ['payment-1'],
  payeeWarnings: [],
  failedRpaTasks: [],
  processMessageCorrelated: true,
  failedChannels: [],
};

describe('finalizeFollowUps', () => {
  it('has nothing to report when every part went through', () => {
    expect(finalizeFollowUps(clean)).toEqual([]);
  });

  it('lists each part that did not go through', () => {
    expect(
      finalizeFollowUps({
        ...clean,
        failedChannels: ['Mina sidor', 'Brev'],
        payeeWarnings: ['Anna Andersson finns inte i Lifecare än'],
        failedRpaTasks: ['REGISTER_PAYMENT'],
        processMessageCorrelated: false,
      })
    ).toEqual([
      { key: 'failedChannels', detail: 'Mina sidor, Brev' },
      { key: 'payeeWarnings', detail: 'Anna Andersson finns inte i Lifecare än' },
      { key: 'failedRpaTasks', detail: 'REGISTER_PAYMENT' },
      { key: 'processNotResumed' },
    ]);
  });
});
