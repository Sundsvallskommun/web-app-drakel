import { HttpException } from '@exceptions/HttpException';
import { ApiResponse } from '@interfaces/api-service.interface';

import {
  applyRecordEdit,
  isEditable,
  LifecareDocumentModel,
  LifecareDocumentsListRaw,
  LifecareEditableRecord,
  LifecareRecordCategory,
  LifecareRecordContentView,
  LifecareRecordView,
  toLifecareRecord,
  toRecordContent,
} from '@/responses/lifecare-documents.response';
import { buildJournalNote, LifecareNoteProposalRaw, NewJournalNote } from '@/responses/lifecare-journal-note.response';

import LifecareApiService from './lifecare-api.service';

/** The Lifecare endpoints for one record kind — reading a record with its body, and saving it. */
interface RecordEndpoints {
  read: string;
  update: string;
  category: LifecareRecordCategory;
}

const JOURNAL_NOTE_ENDPOINTS: RecordEndpoints = {
  read: 'api2/Document/GetJournalNoteWithContent/',
  update: 'api2/Document/UpdateJournalNote/',
  category: 'JOURNAL_NOTE',
};

const DOCUMENT_ENDPOINTS: RecordEndpoints = {
  read: 'api2/Document/GetDocumentWithContent/',
  update: 'api2/Document/UpdateDocument/',
  category: 'DOCUMENT',
};

const PROFESSIONAL_WEB = 'WESE.FC.ProfessionalWeb';

/**
 * Reads a person's documents and journalanteckningar out of Lifecare.
 *
 * `GetDocumentsListForClient` is keyed on the person, not the errand: it returns their whole record
 * across every akt (ekonomi, vuxen, dödsbo …), which is why it takes an identity number rather than
 * an errand id.
 */
class LifecareDocumentsService {
  private readonly apiService = new LifecareApiService();

  /**
   * Lists everything Lifecare holds for one client.
   *
   * The identity number is Lifecare's own for the person — a personnummer, or a reserve number
   * (`19880209T050`) for someone without one. It goes in the query string because that is where the
   * endpoint reads it; the drakel endpoint above keeps it out of its own URL.
   */
  public async listForClient(identityNumber: string): Promise<ApiResponse<LifecareDocumentsListRaw>> {
    return this.apiService.get<LifecareDocumentsListRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Document/GetDocumentsListForClient/',
      params: { id: identityNumber },
    });
  }

  /**
   * Lifecare's proposal for a new journal note on an insats — the selectable note types and a blank note
   * bound to the insats. Every drakel errand is one insats in Lifecare, so this is where its notes go.
   */
  public async readNoteProposal(serviceId: number): Promise<LifecareNoteProposalRaw> {
    const res = await this.apiService.get<LifecareNoteProposalRaw>({
      module: PROFESSIONAL_WEB,
      path: 'api2/Document/GetNoteProposalForService',
      params: { id: String(serviceId) },
    });
    return res.data;
  }

  /**
   * Writes a new journalanteckning on an insats, the way Lifecare's own editor does: fetch the proposal,
   * fill in its blank note and post it to `CreateJournalNote`. Lifecare answers with the new row.
   */
  public async createJournalNote(serviceId: number, input: NewJournalNote & { noteTypeCode: number }): Promise<LifecareRecordView> {
    const proposal = await this.readNoteProposal(serviceId);
    const noteType = proposal.documentNoteTypes.find(candidate => candidate.id === input.noteTypeCode && candidate.isActive);
    if (!noteType) {
      throw new HttpException(400, 'Anteckningstypen finns inte i Lifecare');
    }

    const created = await this.apiService.post<LifecareDocumentModel>(
      { module: PROFESSIONAL_WEB, path: 'api2/Document/CreateJournalNote/' },
      buildJournalNote(proposal, noteType, input),
    );
    return toLifecareRecord(created.data);
  }

  /** Reads a journalanteckning with its body, for viewing or as the base of an edit. */
  public async readJournalNote(id: string): Promise<ApiResponse<LifecareRecordContentView>> {
    return this.readRecord(JOURNAL_NOTE_ENDPOINTS, id);
  }

  /** Reads a document with its body. */
  public async readDocument(id: string): Promise<ApiResponse<LifecareRecordContentView>> {
    return this.readRecord(DOCUMENT_ENDPOINTS, id);
  }

  /** Saves an edit to a journalanteckning, if Lifecare still allows it to be changed. */
  public async updateJournalNote(
    id: string,
    edit: { content: string; occurenceDate?: string; time?: string },
  ): Promise<ApiResponse<LifecareRecordContentView>> {
    return this.updateRecord(JOURNAL_NOTE_ENDPOINTS, id, edit);
  }

  /** Saves an edit to a document, if Lifecare still allows it to be changed. */
  public async updateDocument(
    id: string,
    edit: { content: string; occurenceDate?: string; time?: string },
  ): Promise<ApiResponse<LifecareRecordContentView>> {
    return this.updateRecord(DOCUMENT_ENDPOINTS, id, edit);
  }

  private async fetchEditable(endpoints: RecordEndpoints, id: string): Promise<LifecareEditableRecord> {
    // inEdit=true asks Lifecare for the record in the shape its own editor works on — the same object
    // that goes back on save. hideRevisions keeps the answer to the current version.
    const res = await this.apiService.get<LifecareEditableRecord>({
      module: PROFESSIONAL_WEB,
      path: endpoints.read,
      params: { id, hideRevisions: 'false', inEdit: 'true' },
    });
    return res.data;
  }

  private async readRecord(endpoints: RecordEndpoints, id: string): Promise<ApiResponse<LifecareRecordContentView>> {
    const record = await this.fetchEditable(endpoints, id);
    return { data: toRecordContent(record, endpoints.category), message: 'success' };
  }

  /**
   * Reads the record, applies the edit onto its own object, and posts it back.
   *
   * The whole object is round-tripped because Lifecare's update endpoints expect their own full
   * object, not a patch. Editability is checked against the freshly-read record rather than trusting
   * the caller: a record finalised in Lifecare since the tab was opened is refused here, not silently
   * overwritten.
   */
  private async updateRecord(
    endpoints: RecordEndpoints,
    id: string,
    edit: { content: string; occurenceDate?: string; time?: string },
  ): Promise<ApiResponse<LifecareRecordContentView>> {
    const record = await this.fetchEditable(endpoints, id);
    if (!isEditable(record)) {
      throw new HttpException(409, 'The record is finalised in Lifecare and can no longer be edited');
    }

    const updated = applyRecordEdit(record, edit);
    await this.apiService.post<unknown>({ module: PROFESSIONAL_WEB, path: endpoints.update }, updated);

    return { data: toRecordContent(updated, endpoints.category), message: 'success' };
  }
}

export default LifecareDocumentsService;
