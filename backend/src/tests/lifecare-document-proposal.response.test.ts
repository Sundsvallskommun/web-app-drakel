import { describe, expect, it } from 'vitest';

import { buildDocument, LifecareDocumentProposalRaw, toDocumentTypes } from '@/responses/lifecare-document-proposal.response';

// Shaped after a captured GetDocumentProposalForService answer, trimmed to the fields that matter here.
const letterType = { documentCode: 1, name: 'EK Brev', sortOrder: 0, isActive: true, isForm: false, canChangeOccurenceDate: true };

const proposal: LifecareDocumentProposalRaw = {
  documentTypes: [
    { documentCode: 15, name: 'X Exempelblankett I', sortOrder: 0, isActive: true, isForm: true, canChangeOccurenceDate: true },
    { documentCode: 4, name: 'EK Utredning', sortOrder: 20, isActive: true, isForm: false, canChangeOccurenceDate: false },
    { documentCode: 9, name: 'Utgången typ', sortOrder: 5, isActive: false, isForm: false, canChangeOccurenceDate: true },
    letterType,
  ],
  document: {
    content: null,
    title: '',
    documentId: 0,
    ownerId: 2,
    ownerType: 23,
    documentTypeCode: 0,
    noteTypeCode: 0,
    occurenceDate: '2026-09-23',
    lifecareCreated: true,
  },
};

describe('toDocumentTypes', () => {
  it('lists the active, non-blankett document types in Lifecare order', () => {
    expect(toDocumentTypes(proposal)).toEqual([
      { code: 1, name: 'EK Brev', canChangeOccurenceDate: true },
      { code: 4, name: 'EK Utredning', canChangeOccurenceDate: false },
    ]);
  });
});

describe('buildDocument', () => {
  it('fills the blank document and keeps the insats it is bound to', () => {
    expect(buildDocument(proposal, letterType, { content: '<p>Hej</p>' })).toEqual({
      ...proposal.document,
      content: '<p>Hej</p>',
      title: 'EK Brev',
      documentTypeCode: 1,
    });
  });

  it('takes the rubrik and date the handläggare gave', () => {
    const document = buildDocument(proposal, letterType, { content: '<p>Hej</p>', title: ' Beslut om bistånd ', occurenceDate: '2026-09-20' });

    expect(document.title).toBe('Beslut om bistånd');
    expect(document.occurenceDate).toBe('2026-09-20');
  });

  it('keeps the proposed date when the type does not allow another', () => {
    const fixedDateType = { ...letterType, canChangeOccurenceDate: false };

    expect(buildDocument(proposal, fixedDateType, { content: '<p>Hej</p>', occurenceDate: '2026-09-20' }).occurenceDate).toBe('2026-09-23');
  });
});
