import { describe, expect, it } from 'vitest';

import { isClientFilesPdf, isSummaryPdf } from './attachment-names';

describe('isSummaryPdf', () => {
  it('recognises the generated application summary', () => {
    expect(isSummaryPdf({ fileName: 'Sammanstallning.pdf', documentType: 'GENERATED' })).toBe(true);
  });

  it('does not take a citizen upload of the same name for the summary', () => {
    expect(isSummaryPdf({ fileName: 'sammanstallning.pdf', documentType: 'APPLICATION' })).toBe(false);
    expect(isSummaryPdf({ fileName: 'sammanstallning.pdf', documentType: 'CONVERSATION', messageId: 'm-1' })).toBe(
      false
    );
    expect(isSummaryPdf({ fileName: 'sammanstallning.pdf' })).toBe(false);
  });
});

describe('isClientFilesPdf', () => {
  it('recognises the consolidated client files PDF, which belongs to no message', () => {
    expect(isClientFilesPdf({ fileName: 'klientbilagor.pdf', documentType: 'CONVERSATION' })).toBe(true);
    expect(isClientFilesPdf({ fileName: 'klientbilagor.pdf', documentType: 'GENERATED' })).toBe(true);
  });

  it('does not take a file the citizen sent under that name for it', () => {
    expect(isClientFilesPdf({ fileName: 'klientbilagor.pdf', documentType: 'CONVERSATION', messageId: 'm-1' })).toBe(
      false
    );
    expect(isClientFilesPdf({ fileName: 'klientbilagor.pdf', documentType: 'APPLICATION' })).toBe(false);
  });
});
