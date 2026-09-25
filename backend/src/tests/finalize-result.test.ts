import { toFinalizeResult } from '@utils/finalize-result';
import { describe, expect, it } from 'vitest';

import { LifecareDecisionRegistrationOutcomeEnum } from '@/data-contracts/caremanagement/data-contracts';

describe('toFinalizeResult', () => {
  it("carries careM's decision, process correlation and Lifecare registration, with the channels that failed", () => {
    const result = toFinalizeResult(
      {
        decisionId: 'decision-1',
        processMessageCorrelated: true,
        lifecareDecision: { decisionId: 'decision-1', outcome: LifecareDecisionRegistrationOutcomeEnum.REGISTERED, lifecareId: '98' },
      },
      ['Brev'],
    );

    expect(result).toEqual({
      decisionId: 'decision-1',
      processMessageCorrelated: true,
      lifecareDecision: { decisionId: 'decision-1', outcome: 'REGISTERED', lifecareId: '98' },
      failedChannels: ['Brev'],
    });
  });

  it('keeps what careM says about a beslut that was already registered', () => {
    const result = toFinalizeResult(
      {
        decisionId: 'decision-1',
        processMessageCorrelated: true,
        lifecareDecision: {
          decisionId: 'decision-1',
          outcome: LifecareDecisionRegistrationOutcomeEnum.REGISTERED,
          lifecareId: '98',
          detail: 'Beslutet fanns redan i Lifecare (beslut 98).',
        },
      },
      [],
    );

    expect(result.lifecareDecision).toEqual({
      decisionId: 'decision-1',
      outcome: 'REGISTERED',
      lifecareId: '98',
      detail: 'Beslutet fanns redan i Lifecare (beslut 98).',
    });
  });

  it.each([
    [LifecareDecisionRegistrationOutcomeEnum.FAILED, 'FAILED'],
    [LifecareDecisionRegistrationOutcomeEnum.NOT_SENT, 'NOT_SENT'],
  ])("reports a %s registration with careM's own reason", (outcome, expected) => {
    const result = toFinalizeResult(
      {
        decisionId: 'decision-1',
        processMessageCorrelated: true,
        lifecareDecision: { decisionId: 'decision-1', outcome, detail: 'Lifecare svarade inte' },
      },
      [],
    );

    expect(result.lifecareDecision).toEqual({ decisionId: 'decision-1', outcome: expected, detail: 'Lifecare svarade inte' });
  });

  it("falls back on the finalize's decision id when the registration names none", () => {
    const result = toFinalizeResult(
      { decisionId: 'decision-1', lifecareDecision: { outcome: LifecareDecisionRegistrationOutcomeEnum.REGISTERED, lifecareId: '98' } },
      [],
    );

    expect(result.lifecareDecision).toEqual({ decisionId: 'decision-1', outcome: 'REGISTERED', lifecareId: '98' });
  });

  it('reports no registration when careM reports none, and an uncorrelated process when careM does not say', () => {
    expect(toFinalizeResult({ decisionId: 'decision-1' }, [])).toEqual({
      decisionId: 'decision-1',
      processMessageCorrelated: false,
      failedChannels: [],
    });
  });
});
