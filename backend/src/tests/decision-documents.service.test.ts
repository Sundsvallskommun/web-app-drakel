import CaremanagementAttachmentService from '@services/caremanagement-attachment.service';
import DecisionDocumentsService from '@services/decision-documents.service';
import ErrandLifecareCalculationService from '@services/errand-lifecare-calculation.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import ErrandLifecareRecordsService from '@services/errand-lifecare-records.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';
import { LifecareRecordView } from '@/responses/lifecare-documents.response';

const ownFile = { buffer: Buffer.from('%PDF-own'), originalname: 'hyresavi.pdf', mimetype: 'application/pdf' };
const input = { meddelande: true, message: '<p>Hej,</p>', includeDecision: true, includeCalculation: true, lifecareDocumentIds: [] };

/** A row of the applicant's Lifecare documents. */
const lifecareDocument = (id: string, title: string, documentKind: string): LifecareRecordView => ({
  id,
  category: 'DOCUMENT',
  title,
  dateTime: '2026-09-20',
  type: 'Inkommen handling',
  ownerTypeText: 'EK Ekonomiskt bistånd',
  modifiedBy: '',
  locked: false,
  protected: false,
  documentKind,
});

describe('DecisionDocumentsService', () => {
  beforeEach(() => {
    vi.spyOn(ErrandLifecareDecisionService.prototype, 'pdf').mockResolvedValue(Buffer.from('%PDF-beslut'));
    vi.spyOn(ErrandLifecareCalculationService.prototype, 'pdf').mockResolvedValue(Buffer.from('%PDF-berakning').toString('base64'));
    vi.spyOn(ErrandLifecareRecordsService.prototype, 'list').mockResolvedValue({
      journalNotes: [],
      documents: [lifecareDocument('12', 'Hyreskontrakt: 2026/27', 'Pdf'), lifecareDocument('13', 'Utredning', 'Regular')],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("collects the beslut, the beräkning, the chosen Lifecare PDFs and the handläggare's files", async () => {
    vi.spyOn(ErrandLifecareRecordsService.prototype, 'documentPdf').mockResolvedValue(Buffer.from('%PDF-hyreskontrakt'));

    const documents = await new DecisionDocumentsService().collect('errand-1', 'EB-26090039', { ...input, lifecareDocumentIds: ['12'] }, [ownFile]);

    expect(documents.decision.originalname).toBe('beslut-EB-26090039.pdf');
    expect(documents.attachments.map(file => file.originalname)).toEqual([
      'beslut-EB-26090039.pdf',
      'normberakning-EB-26090039.pdf',
      'Hyreskontrakt- 2026-27.pdf',
      'hyresavi.pdf',
    ]);
    expect(documents.attachments[1]?.buffer.toString()).toBe('%PDF-berakning');
  });

  it('keeps the beslut for the errand but leaves out what the handläggare took away', async () => {
    const calculation = vi.spyOn(ErrandLifecareCalculationService.prototype, 'pdf');

    const documents = await new DecisionDocumentsService().collect(
      'errand-1',
      'EB-26090039',
      { ...input, includeDecision: false, includeCalculation: false },
      [],
    );

    expect(calculation).not.toHaveBeenCalled();
    expect(documents.decision.originalname).toBe('beslut-EB-26090039.pdf');
    expect(documents.attachments).toEqual([]);
  });

  it('refuses a Lifecare document that is not a stored PDF', async () => {
    await expect(
      new DecisionDocumentsService().collect('errand-1', 'EB-26090039', { ...input, lifecareDocumentIds: ['13'] }, []),
    ).rejects.toMatchObject({ status: 400, message: 'Bara PDF-dokument från Lifecare kan skickas med beslutet.' });
  });

  it('refuses the send in the handläggare’s words when Lifecare cannot hand a document over', async () => {
    vi.spyOn(ErrandLifecareDecisionService.prototype, 'pdf').mockRejectedValue(new HttpException(502, 'Lifecare svarade inte'));

    await expect(new DecisionDocumentsService().collect('errand-1', 'EB-26090039', input, [])).rejects.toMatchObject({
      status: 502,
      message: 'Beslutet kunde inte hämtas från Lifecare. Inget är beslutat eller skickat.',
    });
  });

  it('reports a beslut that could not be kept on the errand instead of throwing', async () => {
    vi.spyOn(CaremanagementAttachmentService.prototype, 'createAttachment').mockRejectedValue(new Error('careM svarade inte'));

    const saved = await new DecisionDocumentsService().saveDecisionOnErrand('errand-1', ownFile);

    expect(saved).toBe(false);
  });
});
