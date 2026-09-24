import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import ErrandLifecareRecordsService from '@services/errand-lifecare-records.service';
import LifecareDocumentsService from '@services/lifecare-documents.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';
import { LifecareDocumentModel, LifecareRecordView } from '@/responses/lifecare-documents.response';

const createdNote: LifecareRecordView = {
  id: '138',
  category: 'JOURNAL_NOTE',
  title: 'Journalanteckning',
  dateTime: '2026-09-23T12:11',
  type: 'Journalanteckning',
  ownerTypeText: '',
  modifiedBy: 'RPA_031DEV 2026-09-23',
  locked: false,
  protected: false,
};

const newNote = { content: '<p>Hej</p>', noteTypeCode: 1 };

/** A row of Lifecare's document list; the tests vary its id and kind. */
const listRow: LifecareDocumentModel = {
  id: 0,
  title: 'Anteckning',
  date: '2026-09-23',
  time: '10:00',
  type: 'Journalanteckning',
  ownerTypeText: '',
  responsibleCaseworker: null,
  updateSignature: 'RPA_031DEV',
  updateDate: '2026-09-23',
  protected: false,
  locked: false,
  documentType_Name: 'JournalNote',
  typeCode: 3,
};

describe('ErrandLifecareRecordsService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
      data: { lifecareServiceId: 2 },
      message: 'success',
    });
    vi.spyOn(CaremanagementStakeholderService.prototype, 'readStakeholders').mockResolvedValue({
      data: [{ role: 'APPLICANT', personalNumber: '198802090000' }],
      message: 'success',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes a new note on the insats of the errand and logs it on the errand', async () => {
    const create = vi.spyOn(LifecareDocumentsService.prototype, 'createJournalNote').mockResolvedValue(createdNote);
    const report = vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();

    const created = await new ErrandLifecareRecordsService().createJournalNote('errand-1', newNote);

    expect(created.id).toBe('138');
    expect(create).toHaveBeenCalledWith(2, newNote);
    expect(report.mock.calls[0]?.[1]).toMatchObject([{ action: 'CREATE', target: 'JOURNAL_NOTE', lifecareId: '138' }]);
  });

  it('reads the body of every journalanteckning, leaving out what has none and what Lifecare refuses', async () => {
    vi.spyOn(LifecareDocumentsService.prototype, 'listForClient').mockResolvedValue({
      data: {
        documentModels: [
          { ...listRow, id: 1, documentType_Name: 'JournalNote' },
          { ...listRow, id: 2, documentType_Name: 'JournalNote' },
          { ...listRow, id: 3, documentType_Name: 'Regular', typeCode: 13 },
          { ...listRow, id: 4, documentType_Name: 'Pdf', typeCode: 1 },
        ],
      },
      message: 'success',
    });
    const readBody = vi
      .spyOn(LifecareDocumentsService.prototype, 'readBody')
      .mockImplementation((_category, id) => (id === '2' ? Promise.reject(new HttpException(500, 'down')) : Promise.resolve(`<p>${id}</p>`)));
    const report = vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();

    const bodies = await new ErrandLifecareRecordsService().bodies('errand-1', 'JOURNAL_NOTE');

    expect(bodies).toEqual([{ id: '1', content: '<p>1</p>' }, { id: '2' }]);
    expect(readBody).toHaveBeenCalledTimes(2);
    // One access-log row for the whole tab, not one per record.
    expect(report).toHaveBeenCalledTimes(1);
  });

  it('skips blanketter and PDF files when reading document bodies', async () => {
    vi.spyOn(LifecareDocumentsService.prototype, 'listForClient').mockResolvedValue({
      data: {
        documentModels: [
          { ...listRow, id: 3, documentType_Name: 'Regular', typeCode: 13 },
          { ...listRow, id: 4, documentType_Name: 'Pdf', typeCode: 1 },
          { ...listRow, id: 5, documentType_Name: 'Form', typeCode: 1 },
        ],
      },
      message: 'success',
    });
    vi.spyOn(LifecareDocumentsService.prototype, 'readBody').mockResolvedValue('<p>Brev</p>');
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();

    expect(await new ErrandLifecareRecordsService().bodies('errand-1', 'DOCUMENT')).toEqual([{ id: '3', content: '<p>Brev</p>' }]);
  });

  it('still reports the note as written when careM cannot log it', async () => {
    // The note exists in Lifecare by then; failing would only invite writing it a second time.
    vi.spyOn(LifecareDocumentsService.prototype, 'createJournalNote').mockResolvedValue(createdNote);
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockRejectedValue(new HttpException(500, 'down'));

    await expect(new ErrandLifecareRecordsService().createJournalNote('errand-1', newNote)).resolves.toBe(createdNote);
  });

  it('refuses to write when the applicant has no open insats', async () => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({ data: {}, message: 'success' });
    const create = vi.spyOn(LifecareDocumentsService.prototype, 'createJournalNote');

    await expect(new ErrandLifecareRecordsService().createJournalNote('errand-1', newNote)).rejects.toMatchObject({ status: 409 });
    expect(create).not.toHaveBeenCalled();
  });

  it('writes a new document on the insats of the errand and logs it on the errand', async () => {
    const createdDocument: LifecareRecordView = {
      id: '139',
      category: 'DOCUMENT',
      title: 'EK Brev',
      dateTime: '2026-09-23',
      type: 'EK Brev',
      ownerTypeText: '',
      modifiedBy: 'RPA_031DEV 2026-09-23',
      locked: false,
      protected: false,
    };
    const newDocument = { content: '<p>Hej</p>', documentTypeCode: 1 };
    const create = vi.spyOn(LifecareDocumentsService.prototype, 'createDocument').mockResolvedValue(createdDocument);
    const report = vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();

    const created = await new ErrandLifecareRecordsService().createDocument('errand-1', newDocument);

    expect(created.id).toBe('139');
    expect(create).toHaveBeenCalledWith(2, newDocument);
    expect(report.mock.calls[0]?.[1]).toMatchObject([{ action: 'CREATE', target: 'DOCUMENT', lifecareId: '139' }]);
  });

  it('does not hand over a read careM could not log', async () => {
    vi.spyOn(LifecareDocumentsService.prototype, 'listForClient').mockResolvedValue({ data: { documentModels: [] }, message: 'success' });
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockRejectedValue(new HttpException(500, 'down'));

    await expect(new ErrandLifecareRecordsService().list('errand-1')).rejects.toMatchObject({ status: 500 });
  });

  it('logs a read on the errand', async () => {
    vi.spyOn(LifecareDocumentsService.prototype, 'listForClient').mockResolvedValue({ data: { documentModels: [] }, message: 'success' });
    const report = vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();

    await new ErrandLifecareRecordsService().list('errand-1');

    expect(report.mock.calls[0]?.[1]).toMatchObject([{ action: 'READ', target: 'JOURNAL_AND_DOCUMENTS' }]);
  });
});
