import { describe, expect, it } from 'vitest';

import { buildDecisionMessage } from './decision-message';

describe('buildDecisionMessage', () => {
  it('proposes the message for the ansökan’s month, signed by the handläggare', () => {
    expect(buildDecisionMessage('2026-09', 'Test Handläggare')).toBe(
      [
        'Hej,',
        'Din ansökan för september 2026 är klar. Se bifogade dokument.',
        'Test Handläggare',
        'Sundsvalls kommun',
        'Individ- och Arbetsmarknadsförvaltningen',
        'Enheten för ekonomiskt bistånd',
      ].join('\n')
    );
  });

  it('leaves the month out when the ansökan has none', () => {
    expect(buildDecisionMessage(undefined, 'Test Handläggare')).toContain('Din ansökan är klar. Se bifogade dokument.');
  });
});
