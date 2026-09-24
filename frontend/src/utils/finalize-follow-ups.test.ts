import { DecisionRegistrationOutcomeEnum } from '@data-contracts/backend/data-contracts';
import { describe, expect, it } from 'vitest';

import { finalizeFollowUps } from './finalize-follow-ups';

const clean = {
  paymentIds: [],
  payeeWarnings: [],
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
        processMessageCorrelated: false,
        lifecareDecision: {
          decisionId: 'decision-1',
          outcome: DecisionRegistrationOutcomeEnum.NOT_SENT,
          detail: 'Delvis bifall kan inte registreras i Lifecare från Drakel ännu.',
        },
      })
    ).toEqual([
      { key: 'failedChannels', detail: 'Mina sidor, Brev' },
      { key: 'payeeWarnings', detail: 'Anna Andersson finns inte i Lifecare än' },
      { key: 'processNotResumed' },
      { key: 'decisionNotRegistered', detail: 'Delvis bifall kan inte registreras i Lifecare från Drakel ännu.' },
    ]);
  });
});
