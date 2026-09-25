import { describe, expect, it } from 'vitest';

import { buildJournalNote, LifecareNoteProposalRaw, toNoteTypeView } from '@/responses/lifecare-journal-note.response';

// Shaped after a captured GetNoteProposalForService answer, trimmed to the fields that matter here.
const proposal: LifecareNoteProposalRaw = {
  documentNoteTypes: [
    { id: 3, name: 'Beslut', sortOrder: 0, isActive: true, writeProtectAuto: true },
    { id: 1, name: 'Journalanteckning', sortOrder: 240, isActive: true },
    { id: 9, name: 'Utgången typ', sortOrder: 100, isActive: false },
  ],
  documentJournalNote: {
    content: null,
    title: '',
    documentId: 0,
    ownerId: 1,
    ownerType: 53,
    noteTypeCode: 0,
    occurenceDate: '2026-09-23',
    lifecareCreated: true,
  },
};

const journalNoteType = { id: 1, name: 'Journalanteckning', sortOrder: 240, isActive: true };

describe('toNoteTypeView', () => {
  it('passes a note type from careM through as it is', () => {
    expect(toNoteTypeView({ code: 3, name: 'Beslut', protectedByDefault: true })).toEqual({ code: 3, name: 'Beslut', protectedByDefault: true });
  });

  it('does not make a note skrivskyddad by default when careM does not say so', () => {
    expect(toNoteTypeView({ code: 1, name: 'Journalanteckning' })).toEqual({ code: 1, name: 'Journalanteckning', protectedByDefault: false });
  });
});

describe('buildJournalNote', () => {
  it('fills the blank note and keeps the insats it is bound to', () => {
    expect(buildJournalNote(proposal, journalNoteType, { content: '<p>Hej</p>' })).toEqual({
      ...proposal.documentJournalNote,
      content: '<p>Hej</p>',
      title: 'Journalanteckning',
      noteTypeCode: 1,
      protected: false,
    });
  });

  it('saves the note skrivskyddad when the handläggare asks for it', () => {
    expect(buildJournalNote(proposal, journalNoteType, { content: '<p>Hej</p>', protected: true }).protected).toBe(true);
  });

  it('follows the note type when the handläggare says nothing about skrivskydd', () => {
    const decisionType = { id: 3, name: 'Beslut', sortOrder: 0, isActive: true, writeProtectAuto: true };

    expect(buildJournalNote(proposal, decisionType, { content: '<p>Hej</p>' }).protected).toBe(true);
    expect(buildJournalNote(proposal, decisionType, { content: '<p>Hej</p>', protected: false }).protected).toBe(false);
  });

  it('takes the rubrik and time the handläggare gave', () => {
    const note = buildJournalNote(proposal, journalNoteType, { content: '<p>Hej</p>', title: ' Telefonsamtal ', occurenceTime: '11:50' });

    expect(note.title).toBe('Telefonsamtal');
    expect(note.occurenceTime).toBe('11:50');
  });

  it('takes the date the handläggare picked over the proposed one', () => {
    const note = buildJournalNote(proposal, journalNoteType, { content: '<p>Hej</p>', occurenceDate: '2026-09-20' });

    expect(note.occurenceDate).toBe('2026-09-20');
  });
});
