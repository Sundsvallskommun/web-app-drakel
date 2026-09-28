import CaremanagementAttachmentService, { UploadedFileLike } from '@services/caremanagement-attachment.service';
import ErrandLifecareCalculationService from '@services/errand-lifecare-calculation.service';
import ErrandLifecareDecisionService from '@services/errand-lifecare-decision.service';
import ErrandLifecareRecordsService from '@services/errand-lifecare-records.service';
import { httpStatusOf } from '@utils/http-error-status';
import { logger } from '@utils/logger';

import { FinalizeErrandDto } from '@/dtos/finalize.dto';
import { HttpException } from '@/exceptions/HttpException';

const DECISION_DOCUMENT_TYPE = 'DECISION';
const PDF_MIME_TYPE = 'application/pdf';
// careM's documentKind for a stored file, e.g. an inkommen handling — the only kind Lifecare hands over as a PDF yet.
const PDF_DOCUMENT_KIND = 'Pdf';

/** The documents of one send: the beslut, always kept on the errand, and everything that goes with the message. */
interface DecisionDocuments {
  decision: UploadedFileLike;
  attachments: UploadedFileLike[];
}

const pdfFile = (buffer: Buffer, originalname: string): UploadedFileLike => ({ buffer, originalname, mimetype: PDF_MIME_TYPE });

/** A Lifecare title as a file name: characters a file name cannot hold become dashes. */
const toPdfFileName = (title: string): string => `${title.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'dokument'}.pdf`;

/**
 * Fetches one document, refusing the send in the handläggare's words when Lifecare could not hand it over. The
 * refusal names what is missing but never a Lifecare title, which may carry personal data into the logs.
 */
const fetchOrRefuse = async <T>(label: string, fetchDocument: () => Promise<T>): Promise<T> => {
  try {
    return await fetchDocument();
  } catch (error) {
    throw new HttpException(httpStatusOf(error) ?? 502, `${label} kunde inte hämtas från Lifecare. Inget är beslutat eller skickat.`);
  }
};

/**
 * The PDFs of "Skicka beräkning och beslut": Lifecare's print of the beslut, of the beräkning when kept, the
 * handläggare's chosen Lifecare documents (stored PDFs only) and the files from their computer. They are all fetched
 * before the errand is finalized, so one Lifecare cannot hand over stops the send while nothing is decided yet.
 */
class DecisionDocumentsService {
  private lifecareDecision = new ErrandLifecareDecisionService();
  private lifecareCalculation = new ErrandLifecareCalculationService();
  private lifecareRecords = new ErrandLifecareRecordsService();
  private attachmentService = new CaremanagementAttachmentService();

  async collect(errandId: string, errandNumber: string, input: FinalizeErrandDto, files: UploadedFileLike[]): Promise<DecisionDocuments> {
    const [decision, calculation, lifecareDocuments] = await Promise.all([
      fetchOrRefuse('Beslutet', () => this.lifecareDecision.pdf(errandId)),
      input.includeCalculation ? fetchOrRefuse('Normberäkningen', () => this.lifecareCalculation.pdf(errandId)) : Promise.resolve(undefined),
      this.lifecareDocuments(errandId, input.lifecareDocumentIds),
    ]);
    const decisionFile = pdfFile(decision, `beslut-${errandNumber}.pdf`);
    return {
      decision: decisionFile,
      attachments: [
        ...(input.includeDecision ? [decisionFile] : []),
        // The beräkning's PDF comes back base64-encoded, as the Normberäkning tab shows it.
        ...(calculation ? [pdfFile(Buffer.from(calculation, 'base64'), `normberakning-${errandNumber}.pdf`)] : []),
        ...lifecareDocuments,
        ...files,
      ],
    };
  }

  /** Keeps Lifecare's print of the beslut on the errand as its DECISION attachment; a failure is reported, not thrown. */
  async saveDecisionOnErrand(errandId: string, decision: UploadedFileLike): Promise<boolean> {
    try {
      await this.attachmentService.createAttachment(errandId, decision, DECISION_DOCUMENT_TYPE);
      return true;
    } catch {
      logger.warn(`Finalized errand ${errandId} but could not keep the beslut on it`);
      return false;
    }
  }

  /** The chosen Lifecare documents as PDFs, named by their titles; only a stored PDF can be sent. */
  private async lifecareDocuments(errandId: string, ids: string[]): Promise<UploadedFileLike[]> {
    if (ids.length === 0) {
      return [];
    }
    const records = await fetchOrRefuse('Dokumentlistan', () => this.lifecareRecords.list(errandId));
    return Promise.all(
      ids.map(async id => {
        const document = records.documents.find(record => record.id === id);
        if (document?.documentKind !== PDF_DOCUMENT_KIND) {
          throw new HttpException(400, 'Bara PDF-dokument från Lifecare kan skickas med beslutet.');
        }
        const pdf = await fetchOrRefuse('Ett av dokumenten från Lifecare', () => this.lifecareRecords.documentPdf(errandId, id));
        return pdfFile(pdf, toPdfFileName(document.title));
      }),
    );
  }
}

export default DecisionDocumentsService;
