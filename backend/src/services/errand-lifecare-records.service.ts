import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';

import {
  CreateLifecareDocumentRequest,
  CreateLifecareJournalNoteRequest,
  LifecareDocumentType,
  LifecareNoteType,
  LifecareRecord,
  LifecareRecordBody,
  LifecareRecordContent,
  LifecareRecords,
  UpdateLifecareRecordRequest,
} from '@/data-contracts/caremanagement/data-contracts';
import { LifecareDocumentTypeView, toDocumentTypeView } from '@/responses/lifecare-document-proposal.response';
import {
  LifecareRecordBodyView,
  LifecareRecordCategory,
  LifecareRecordContentView,
  LifecareRecordsView,
  LifecareRecordView,
  toRecordBodyView,
  toRecordContentView,
  toRecordsView,
  toRecordView,
} from '@/responses/lifecare-documents.response';
import { LifecareNoteTypeView, toNoteTypeView } from '@/responses/lifecare-journal-note.response';

/** careM's path segment, under `/lifecare/documents`, for one record of each group. */
const RECORD_SEGMENT: Record<LifecareRecordCategory, string> = { JOURNAL_NOTE: 'journal-notes', DOCUMENT: 'documents' };

/** careM's path segment, under `/lifecare`, for each group's bodies. */
const BODIES_SEGMENT: Record<LifecareRecordCategory, string> = { JOURNAL_NOTE: 'journal-note-bodies', DOCUMENT: 'document-bodies' };

/** One record's careM URL. The id comes from drakel's own URL, so it is encoded to stay one path segment. */
const recordUrl = (errandId: string, category: LifecareRecordCategory, id: string): string =>
  caremanagementLifecareUrl(errandId, 'documents', RECORD_SEGMENT[category], encodeURIComponent(id));

/**
 * The applicant's Lifecare journalanteckningar and documents, seen from an errand, through careM.
 *
 * Every call is keyed by errand: careM resolves the applicant's personnummer (for the person-wide list) and the
 * insats (for new records) from it, so no personnummer travels in drakel's URLs. careM refuses a record that is not
 * in the applicant's Lifecare record (404) and logs every read and write itself.
 */
class ErrandLifecareRecordsService {
  private apiService = new CaremanagementApiService();

  /** The applicant's whole Lifecare record, split into journalanteckningar and documents. */
  async list(errandId: string): Promise<LifecareRecordsView> {
    const response = await this.apiService.get<LifecareRecords>({ url: caremanagementLifecareUrl(errandId, 'documents') });
    return toRecordsView(response.data);
  }

  /** The bodies of one group's records, so the tab can show every record's text without opening it. */
  async bodies(errandId: string, category: LifecareRecordCategory): Promise<LifecareRecordBodyView[]> {
    const response = await this.apiService.get<LifecareRecordBody[]>({ url: caremanagementLifecareUrl(errandId, BODIES_SEGMENT[category]) });
    return response.data.map(toRecordBodyView);
  }

  async readJournalNote(errandId: string, id: string): Promise<LifecareRecordContentView> {
    return this.readRecord(errandId, 'JOURNAL_NOTE', id);
  }

  async readDocument(errandId: string, id: string): Promise<LifecareRecordContentView> {
    return this.readRecord(errandId, 'DOCUMENT', id);
  }

  async updateJournalNote(errandId: string, id: string, edit: UpdateLifecareRecordRequest): Promise<LifecareRecordContentView> {
    return this.updateRecord(errandId, 'JOURNAL_NOTE', id, edit);
  }

  async updateDocument(errandId: string, id: string, edit: UpdateLifecareRecordRequest): Promise<LifecareRecordContentView> {
    return this.updateRecord(errandId, 'DOCUMENT', id, edit);
  }

  /** The note types a new journalanteckning on the errand's insats can have. */
  async journalNoteTypes(errandId: string): Promise<LifecareNoteTypeView[]> {
    const response = await this.apiService.get<LifecareNoteType[]>({ url: caremanagementLifecareUrl(errandId, 'documents', 'journal-note-types') });
    return response.data.map(toNoteTypeView);
  }

  /** Writes a new journalanteckning on the errand's insats in Lifecare. */
  async createJournalNote(errandId: string, input: CreateLifecareJournalNoteRequest): Promise<LifecareRecordView> {
    const response = await this.apiService.post<LifecareRecord>({
      url: caremanagementLifecareUrl(errandId, 'documents', RECORD_SEGMENT.JOURNAL_NOTE),
      data: input,
    });
    return toRecordView(response.data, 'JOURNAL_NOTE');
  }

  /** The document types a new document on the errand's insats can have. */
  async documentTypes(errandId: string): Promise<LifecareDocumentTypeView[]> {
    const response = await this.apiService.get<LifecareDocumentType[]>({ url: caremanagementLifecareUrl(errandId, 'documents', 'document-types') });
    return response.data.map(toDocumentTypeView);
  }

  /** Writes a new document on the errand's insats in Lifecare. */
  async createDocument(errandId: string, input: CreateLifecareDocumentRequest): Promise<LifecareRecordView> {
    const response = await this.apiService.post<LifecareRecord>({
      url: caremanagementLifecareUrl(errandId, 'documents', RECORD_SEGMENT.DOCUMENT),
      data: input,
    });
    return toRecordView(response.data, 'DOCUMENT');
  }

  /** One of the applicant's records with its body. */
  private async readRecord(errandId: string, category: LifecareRecordCategory, id: string): Promise<LifecareRecordContentView> {
    const response = await this.apiService.get<LifecareRecordContent>({ url: recordUrl(errandId, category, id) });
    return toRecordContentView(response.data, category);
  }

  /** Saves an edit onto one of the applicant's records; careM refuses one that is finalised in Lifecare (409). */
  private async updateRecord(
    errandId: string,
    category: LifecareRecordCategory,
    id: string,
    edit: UpdateLifecareRecordRequest,
  ): Promise<LifecareRecordContentView> {
    const response = await this.apiService.put<LifecareRecordContent>({ url: recordUrl(errandId, category, id), data: edit });
    return toRecordContentView(response.data, category);
  }
}

export default ErrandLifecareRecordsService;
