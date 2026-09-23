import { describe, expect, it } from 'vitest';

import {
  applyRecordEdit,
  isEditable,
  LifecareDocumentsListRaw,
  LifecareEditableRecord,
  toLifecareRecords,
  toRecordContent,
} from '@/responses/lifecare-documents.response';

const model = (overrides: Partial<LifecareDocumentsListRaw['documentModels'][number]>): LifecareDocumentsListRaw['documentModels'][number] => ({
  id: 1,
  title: 'Journalanteckning',
  date: '2026-09-22',
  time: '17:01',
  type: 'Journalanteckning',
  ownerTypeText: 'EK Ekonomiskt bistånd',
  responsibleCaseworker: 'RPA_031DEV',
  updateSignature: 'RPA_031DEV',
  updateDate: '2026-09-22',
  protected: true,
  locked: false,
  documentType_Name: 'JournalNote',
  ...overrides,
});

describe('toLifecareRecords', () => {
  it('splits journalanteckningar from documents by Lifecare document type', () => {
    const raw: LifecareDocumentsListRaw = {
      documentModels: [
        model({ id: 1, documentType_Name: 'JournalNote' }),
        model({ id: 2, documentType_Name: 'Form', type: 'X Exempelblankett I' }),
        model({ id: 3, documentType_Name: 'Pdf', type: 'Inkommen handling' }),
        model({ id: 4, documentType_Name: 'JournalNote', type: 'Beslut' }),
      ],
    };

    const { journalNotes, documents } = toLifecareRecords(raw);

    expect(journalNotes.map(record => record.id)).toEqual(['1', '4']);
    expect(documents.map(record => record.id)).toEqual(['2', '3']);
  });

  it('joins the separate date and time into one ISO date-time', () => {
    const { journalNotes } = toLifecareRecords({ documentModels: [model({ date: '2026-09-22', time: '17:01' })] });

    expect(journalNotes[0]?.dateTime).toBe('2026-09-22T17:01');
  });

  it('carries the signature and date as the modified-by line', () => {
    const { journalNotes } = toLifecareRecords({ documentModels: [model({ updateSignature: 'RPA_031DEV', updateDate: '2026-09-22' })] });

    expect(journalNotes[0]?.modifiedBy).toBe('RPA_031DEV 2026-09-22');
  });

  it('survives a missing payload', () => {
    expect(toLifecareRecords(undefined)).toEqual({ journalNotes: [], documents: [] });
  });
});

describe('isEditable', () => {
  it('allows a record that is neither protected nor locked', () => {
    expect(isEditable({ protected: false, locked: false })).toBe(true);
  });

  it('refuses a protected (finalised) record', () => {
    // A finalised journalanteckning is an upprättad handling — it must not be silently overwritten.
    expect(isEditable({ protected: true })).toBe(false);
  });

  it('refuses a record that carries a lock signature', () => {
    expect(isEditable({ protected: false, lockedSignature: 'ebb14eri', lockedDate: '2026-09-24' })).toBe(false);
  });
});

describe('toRecordContent', () => {
  it('reads the body, date and time off the Lifecare object', () => {
    const record: LifecareEditableRecord = {
      documentId: 135,
      title: 'Journalanteckning',
      content: '<p>hej</p>',
      occurenceDate: '2026-09-23',
      time: '09:02',
      protected: false,
    };

    const view = toRecordContent(record, 'JOURNAL_NOTE');

    expect(view).toMatchObject({ id: '135', content: '<p>hej</p>', occurenceDate: '2026-09-23', time: '09:02', editable: true });
  });

  it('falls back to occurenceTime when time is absent', () => {
    const view = toRecordContent({ documentId: 1, occurenceTime: '08:00' }, 'DOCUMENT');
    expect(view.time).toBe('08:00');
  });
});

describe('applyRecordEdit', () => {
  it('changes only the edited fields and keeps the rest of the object', () => {
    const record: LifecareEditableRecord = {
      documentId: 135,
      content: '<p>old</p>',
      occurenceDate: '2026-09-01',
      time: '08:00',
      documentNoteType: { id: 1, name: 'Journalanteckning' },
      ownerId: 7,
      ownerType: 53,
    };

    const updated = applyRecordEdit(record, { content: '<p>new</p>', occurenceDate: '2026-09-23', time: '09:02' });

    expect(updated.content).toBe('<p>new</p>');
    expect(updated.occurenceDate).toBe('2026-09-23');
    expect(updated.time).toBe('09:02');
    // occurenceTime is kept in step with time — Lifecare carries both.
    expect(updated.occurenceTime).toBe('09:02');
    // The opaque parts of the object ride along untouched.
    expect(updated.documentNoteType).toEqual({ id: 1, name: 'Journalanteckning' });
    expect(updated.ownerId).toBe(7);
  });

  it('leaves the existing date and time when the edit omits them', () => {
    const updated = applyRecordEdit({ documentId: 1, occurenceDate: '2026-09-01', time: '08:00' }, { content: '<p>x</p>' });

    expect(updated.occurenceDate).toBe('2026-09-01');
    expect(updated.time).toBe('08:00');
  });
});
