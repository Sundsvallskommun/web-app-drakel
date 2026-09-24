import { buildFinalizeRequest } from '@utils/finalize-request';
import { describe, expect, it } from 'vitest';

import { FinalizeDecisionOutcomeEnum } from '@/data-contracts/caremanagement/data-contracts';
import { LifecareDecisionView } from '@/responses/lifecare-decision.response';

const communication = { minaSidor: true, digitalMailbox: false, letter: true };

/** The beslut as it stands in Lifecare. */
const beslut = {
  id: 98,
  outcome: 'BIFALL',
  date: '2026-06-20',
  amount: 7900,
  periodFrom: '2026-06-01',
  periodTo: '2026-06-30',
  reason: 'Arbetslös',
  message: '<p>Du beviljas bistånd</p>',
  locked: false,
  decisionMaker: 'Test Handläggare',
} satisfies LifecareDecisionView;

describe('buildFinalizeRequest', () => {
  it('builds the payload from the Lifecare beslut, with no utbetalningar', () => {
    const request = buildFinalizeRequest({ beslut, communication, householdSizeChanged: true });

    expect(request.decision).toEqual({
      outcome: FinalizeDecisionOutcomeEnum.BIFALL,
      reason: 'Arbetslös',
      periodFrom: '2026-06-01',
      periodTo: '2026-06-30',
      amount: 7900,
      decisionMessage: '<p>Du beviljas bistånd</p>',
    });
    expect(request.communication).toBe(communication);
    // The Utbetalning tab registers utbetalningar in Lifecare directly; careM gets none.
    expect(request.payments).toEqual([]);
    expect(request.householdSizeChanged).toBe(true);
  });

  it('sends no amount for an avslag', () => {
    const request = buildFinalizeRequest({
      beslut: { ...beslut, outcome: 'AVSLAG', amount: 0 },
      communication,
      householdSizeChanged: false,
    });

    expect(request.payments).toEqual([]);
    expect(request.decision.amount).toBe(0);
  });

  it('refuses when no beslut has been saved', () => {
    expect(() => buildFinalizeRequest({ beslut: undefined, communication, householdSizeChanged: false })).toThrow(
      expect.objectContaining({ status: 400 }),
    );
  });

  it('refuses a Lifecare beslutstyp Drakel does not finalize', () => {
    expect(() =>
      buildFinalizeRequest({
        beslut: { ...beslut, outcome: undefined },
        communication,
        householdSizeChanged: false,
      }),
    ).toThrow(expect.objectContaining({ status: 400 }));
  });
});
