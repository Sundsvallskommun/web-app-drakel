import { describe, expect, it } from 'vitest';

import { toDocumentTypeView } from '@/responses/lifecare-document-proposal.response';

describe('toDocumentTypeView', () => {
  it('passes a document type from careM through as it is', () => {
    const utredning = { code: 4, name: 'EK Utredning', canChangeOccurenceDate: false, protectedByDefault: true };

    expect(toDocumentTypeView(utredning)).toEqual(utredning);
  });

  it('keeps the proposed date and no skrivskydd when careM does not say otherwise', () => {
    expect(toDocumentTypeView({ code: 1, name: 'EK Brev' })).toEqual({
      code: 1,
      name: 'EK Brev',
      canChangeOccurenceDate: false,
      protectedByDefault: false,
    });
  });
});
