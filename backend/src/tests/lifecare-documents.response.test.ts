import { describe, expect, it } from 'vitest';

import { LifecareRecord, LifecareRecordCategoryEnum } from '@/data-contracts/caremanagement/data-contracts';
import {
  applyRecordEdit,
  isEditable,
  LifecareEditableRecord,
  toRecordBodyView,
  toRecordContent,
  toRecordContentView,
  toRecordsView,
} from '@/responses/lifecare-documents.response';

/** A journalanteckning as careM lists it. */
const careMJournalNote: LifecareRecord = {
  id: '1',
  category: LifecareRecordCategoryEnum.JOURNAL_NOTE,
  title: 'Journalanteckning',
  dateTime: '2026-09-22T17:01',
  type: 'Journalanteckning',
  ownerTypeText: 'EK Ekonomiskt bistånd',
  responsibleCaseworker: 'RPA_031DEV',
  modifiedBy: 'RPA_031DEV 2026-09-22',
  locked: false,
  protected: true,
};

describe('toRecordsView', () => {
  it("passes careM's split through as it is", () => {
    const records = toRecordsView({ journalNotes: [careMJournalNote], documents: [] });

    expect(records).toEqual({ journalNotes: [careMJournalNote], documents: [] });
  });

  it('shows a field careM leaves out as empty, and a record without category under the group it came in', () => {
    const records = toRecordsView({ documents: [{ id: '2' }] });

    expect(records).toEqual({
      journalNotes: [],
      documents: [
        {
          id: '2',
          category: 'DOCUMENT',
          title: '',
          dateTime: '',
          type: '',
          ownerTypeText: '',
          responsibleCaseworker: undefined,
          modifiedBy: '',
          locked: false,
          protected: false,
        },
      ],
    });
  });
});

describe('toRecordContentView', () => {
  it('shows a record careM does not say is editable as read-only', () => {
    expect(toRecordContentView({ id: '7', content: '<p>Hej</p>' }, 'DOCUMENT')).toEqual({
      id: '7',
      category: 'DOCUMENT',
      title: '',
      content: '<p>Hej</p>',
      occurenceDate: '',
      time: '',
      editable: false,
    });
  });
});

describe('toRecordBodyView', () => {
  it('leaves the content out when Lifecare would not hand it over', () => {
    expect(toRecordBodyView({ id: '3' })).toEqual({ id: '3', content: undefined });
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

  it('write-protects the record only when the save asks for it', () => {
    const record: LifecareEditableRecord = { documentId: 1, content: '<p>old</p>', protected: false };

    expect(applyRecordEdit(record, { content: '<p>x</p>' }).protected).toBe(false);
    expect(applyRecordEdit(record, { content: '<p>x</p>', protected: true }).protected).toBe(true);
  });

  it('leaves the existing date and time when the edit omits them', () => {
    const updated = applyRecordEdit({ documentId: 1, occurenceDate: '2026-09-01', time: '08:00' }, { content: '<p>x</p>' });

    expect(updated.occurenceDate).toBe('2026-09-01');
    expect(updated.time).toBe('08:00');
  });
});
