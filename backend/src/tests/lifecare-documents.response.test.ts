import { describe, expect, it } from 'vitest';

import { LifecareRecord, LifecareRecordCategoryEnum } from '@/data-contracts/caremanagement/data-contracts';
import { toRecordBodyView, toRecordContentView, toRecordsView } from '@/responses/lifecare-documents.response';

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
