import { describe, expect, it } from 'vitest';

import { buildDecisionMessage } from './decision-message';

describe('buildDecisionMessage', () => {
  it('proposes the message for the ansökan’s month, signed by the handläggare with the förvaltning and enhet in bold', () => {
    expect(buildDecisionMessage('2026-10', 'Test Handläggare')).toEqual({
      markup:
        '<p>Hej,</p><p><br></p>' +
        '<p>Din ansökan för oktober 2026 är klar. Se bifogade dokument.</p><p><br></p>' +
        '<p>Test Handläggare</p>' +
        '<p><strong>Individ- och Arbetsmarknadsförvaltningen</strong></p>' +
        '<p><strong>Enheten för ekonomiskt bistånd</strong></p>',
      plainText: [
        'Hej,',
        '',
        'Din ansökan för oktober 2026 är klar. Se bifogade dokument.',
        '',
        'Test Handläggare',
        'Individ- och Arbetsmarknadsförvaltningen',
        'Enheten för ekonomiskt bistånd',
      ].join('\n'),
    });
  });

  it('leaves the month out when the ansökan has none', () => {
    expect(buildDecisionMessage(undefined, 'Test Handläggare').plainText).toContain(
      'Din ansökan är klar. Se bifogade dokument.'
    );
  });

  it('keeps a name from becoming markup', () => {
    expect(buildDecisionMessage(undefined, '<b>Test</b>').markup).toContain('<p>&lt;b&gt;Test&lt;/b&gt;</p>');
  });
});
