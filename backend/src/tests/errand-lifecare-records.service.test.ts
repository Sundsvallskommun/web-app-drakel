import CaremanagementApiService from '@services/caremanagement-api.service';
import ErrandLifecareRecordsService from '@services/errand-lifecare-records.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  LifecareRecord,
  LifecareRecordCategoryEnum,
  LifecareRecordContent,
  LifecareRecordContentCategoryEnum,
} from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const documentsUrl = (...parts: string[]): string => caremanagementLifecareUrl('errand-1', 'documents', ...parts);

/** Journalanteckning 41 as careM lists it — and answers a create with. */
const journalNote: LifecareRecord = {
  id: '41',
  category: LifecareRecordCategoryEnum.JOURNAL_NOTE,
  title: 'Journalanteckning',
  dateTime: '2026-09-22T17:01',
  type: 'Journalanteckning',
  ownerTypeText: 'EK Ekonomiskt bistånd',
  responsibleCaseworker: 'RPA_031DEV',
  modifiedBy: 'RPA_031DEV 2026-09-22',
  locked: false,
  protected: false,
};

/** Document 7 as careM lists it. */
const document: LifecareRecord = { ...journalNote, id: '7', category: LifecareRecordCategoryEnum.DOCUMENT, type: 'EK Brev', title: 'EK Brev' };

/** Journalanteckning 41 opened, with its body. */
const openedNote: LifecareRecordContent = {
  id: '41',
  category: LifecareRecordContentCategoryEnum.JOURNAL_NOTE,
  title: 'Journalanteckning',
  content: '<p>Ringde sökande</p>',
  occurenceDate: '2026-09-22',
  time: '17:01',
  editable: true,
};

const edit = { content: '<p>Ringde sökande igen</p>', occurenceDate: '2026-09-23', time: '09:15' };

/** careM's answer as CaremanagementApiService hands it over. */
const answer = (data: unknown, status = 200) => ({ data, message: 'success', status });

describe('ErrandLifecareRecordsService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists the applicant's journalanteckningar and documents from careM", async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answer({ journalNotes: [journalNote], documents: [document] }));

    expect(await new ErrandLifecareRecordsService().list('errand-1')).toEqual({ journalNotes: [journalNote], documents: [document] });
    expect(get).toHaveBeenCalledWith({ url: documentsUrl() });
  });

  it("reads the journalanteckningar's bodies from careM, keeping one Lifecare would not hand over without content", async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answer([{ id: '41', content: '<p>Hej</p>' }, { id: '42' }]));

    expect(await new ErrandLifecareRecordsService().bodies('errand-1', 'JOURNAL_NOTE')).toEqual([
      { id: '41', content: '<p>Hej</p>' },
      { id: '42', content: undefined },
    ]);
    expect(get).toHaveBeenCalledWith({ url: caremanagementLifecareUrl('errand-1', 'journal-note-bodies') });
  });

  it("reads the documents' bodies from careM", async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answer([]));

    expect(await new ErrandLifecareRecordsService().bodies('errand-1', 'DOCUMENT')).toEqual([]);
    expect(get).toHaveBeenCalledWith({ url: caremanagementLifecareUrl('errand-1', 'document-bodies') });
  });

  it('reads a journalanteckning with its body from careM', async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answer(openedNote));

    expect(await new ErrandLifecareRecordsService().readJournalNote('errand-1', '41')).toEqual(openedNote);
    expect(get).toHaveBeenCalledWith({ url: documentsUrl('journal-notes', '41') });
  });

  it('reads a document with its body from careM', async () => {
    const openedDocument = { ...openedNote, id: '7', category: LifecareRecordContentCategoryEnum.DOCUMENT };
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answer(openedDocument));

    expect(await new ErrandLifecareRecordsService().readDocument('errand-1', '7')).toEqual(openedDocument);
    expect(get).toHaveBeenCalledWith({ url: documentsUrl('documents', '7') });
  });

  it("passes on careM's refusal of a journalanteckning that is not the sökande's", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockRejectedValue(new HttpException(404, 'Not found'));

    await expect(new ErrandLifecareRecordsService().readJournalNote('errand-1', '99')).rejects.toMatchObject({ status: 404 });
  });

  it('keeps an id from the URL to one path segment in careM', async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answer(openedNote));

    await new ErrandLifecareRecordsService().readJournalNote('errand-1', '../../41');
    expect(get).toHaveBeenCalledWith({ url: documentsUrl('journal-notes', '..%2F..%2F41') });
  });

  it('saves an edit to a journalanteckning through careM and answers with the saved record', async () => {
    const saved = { ...openedNote, content: edit.content, occurenceDate: edit.occurenceDate, time: edit.time };
    const put = vi.spyOn(CaremanagementApiService.prototype, 'put').mockResolvedValue(answer(saved));

    expect(await new ErrandLifecareRecordsService().updateJournalNote('errand-1', '41', edit)).toEqual(saved);
    expect(put).toHaveBeenCalledWith({ url: documentsUrl('journal-notes', '41'), data: edit });
  });

  it('saves an edit to a document through careM', async () => {
    const put = vi.spyOn(CaremanagementApiService.prototype, 'put').mockResolvedValue(answer({ ...openedNote, id: '7' }));

    await new ErrandLifecareRecordsService().updateDocument('errand-1', '7', { content: '<p>Brev</p>', protected: true });
    expect(put).toHaveBeenCalledWith({ url: documentsUrl('documents', '7'), data: { content: '<p>Brev</p>', protected: true } });
  });

  it("passes on careM's refusal of an edit to a record finalised in Lifecare", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'put').mockRejectedValue(new HttpException(409, 'The record is finalised in Lifecare'));

    await expect(new ErrandLifecareRecordsService().updateDocument('errand-1', '7', edit)).rejects.toMatchObject({
      status: 409,
      message: 'The record is finalised in Lifecare',
    });
  });

  it('lists the note types for a new journalanteckning from careM', async () => {
    const noteTypes = [{ code: 1, name: 'Journalanteckning', protectedByDefault: false }];
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answer(noteTypes));

    expect(await new ErrandLifecareRecordsService().journalNoteTypes('errand-1')).toEqual(noteTypes);
    expect(get).toHaveBeenCalledWith({ url: documentsUrl('journal-note-types') });
  });

  it('lists the document types for a new document from careM', async () => {
    const documentTypes = [{ code: 1, name: 'EK Brev', canChangeOccurenceDate: true, protectedByDefault: false }];
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answer(documentTypes));

    expect(await new ErrandLifecareRecordsService().documentTypes('errand-1')).toEqual(documentTypes);
    expect(get).toHaveBeenCalledWith({ url: documentsUrl('document-types') });
  });

  it('writes a new journalanteckning through careM and answers with the row careM created', async () => {
    const input = { content: '<p>Ringde sökande</p>', noteTypeCode: 1, occurenceTime: '17:01' };
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue(answer(journalNote, 201));

    expect(await new ErrandLifecareRecordsService().createJournalNote('errand-1', input)).toEqual(journalNote);
    expect(post).toHaveBeenCalledWith({ url: documentsUrl('journal-notes'), data: input });
  });

  it('writes a new document through careM and answers with the row careM created', async () => {
    const input = { content: '<p>Brev</p>', documentTypeCode: 1, title: 'Brev om hyran' };
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue(answer(document, 201));

    expect(await new ErrandLifecareRecordsService().createDocument('errand-1', input)).toEqual(document);
    expect(post).toHaveBeenCalledWith({ url: documentsUrl('documents'), data: input });
  });

  it("passes on careM's refusal to write when the errand has no Lifecare insats yet", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'post').mockRejectedValue(new HttpException(409, 'The errand has no Lifecare insats'));

    await expect(new ErrandLifecareRecordsService().createJournalNote('errand-1', { content: '<p>Hej</p>', noteTypeCode: 1 })).rejects.toMatchObject({
      status: 409,
    });
  });
});
