import {
  CreateLifecareDocumentDto,
  CreateLifecareJournalNoteDto,
  LifecareDocumentTypesApiResponse,
  LifecareDocumentTypeView,
  LifecareNoteTypesApiResponse,
  LifecareNoteTypeView,
  LifecareRecordBodiesApiResponse,
  LifecareRecordBodyView,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** Which group a Lifecare record belongs to. */
export type LifecareRecordCategory = 'JOURNAL_NOTE' | 'DOCUMENT';

/** A Lifecare record — a journalanteckning or a document. Mirrors the backend LifecareRecordView. */
export interface LifecareRecord {
  id: string;
  category: LifecareRecordCategory;
  title: string;
  /** Documented date and time as an ISO date-time. */
  dateTime: string;
  /** Lifecare's type label, e.g. "Journalanteckning", "Beslut", "Inkommen handling". */
  type: string;
  /** The akt/utredning the record sits under, e.g. "EK Ekonomiskt bistånd". */
  ownerTypeText: string;
  responsibleCaseworker?: string;
  /** Who last changed it and when, as Lifecare presents it. */
  modifiedBy: string;
  locked: boolean;
  protected: boolean;
}

/** A person's Lifecare record, split into the two groups the tab shows. */
export interface LifecareRecords {
  journalNotes: LifecareRecord[];
  documents: LifecareRecord[];
}

/** A Lifecare record with its body, as returned when a record is opened. */
export interface LifecareRecordContent {
  id: string;
  category: LifecareRecordCategory;
  title: string;
  /** The body as HTML. */
  content: string;
  /** Documented date, `YYYY-MM-DD`. */
  occurenceDate: string;
  /** Documented time, `HH:mm`. */
  time: string;
  /** Whether the record may still be edited in Lifecare. */
  editable: boolean;
}

/** The edits a handläggare can make to a Lifecare record. */
export interface LifecareRecordEdit {
  content: string;
  occurenceDate?: string;
  time?: string;
}

/** The BFF path segment for a record kind. */
const pathFor = (category: LifecareRecordCategory): string =>
  category === 'JOURNAL_NOTE' ? 'journal-notes' : 'documents';

/** Fetches the applicant's Lifecare record (journalanteckningar and documents) for an errand. */
export const getLifecareRecords = (errandId: string): Promise<ServiceResponse<LifecareRecords>> =>
  apiService
    .get<ApiResponse<LifecareRecords>>(`errands/${errandId}/lifecare-documents`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Fetches one Lifecare record with its body. Read through the errand, so the read is logged on it. */
export const getLifecareRecordContent = (
  errandId: string,
  category: LifecareRecordCategory,
  id: string
): Promise<ServiceResponse<LifecareRecordContent>> =>
  apiService
    .get<ApiResponse<LifecareRecordContent>>(`errands/${errandId}/lifecare-documents/${pathFor(category)}/${id}`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/**
 * The bodies of every record in one group, so the tab can show their text without opening each one.
 * Lifecare reads them one by one behind this call, so it answers after the list itself.
 */
export const getLifecareRecordBodies = (
  errandId: string,
  category: LifecareRecordCategory
): Promise<ServiceResponse<LifecareRecordBodyView[]>> =>
  apiService
    .get<LifecareRecordBodiesApiResponse>(
      `errands/${errandId}/${category === 'JOURNAL_NOTE' ? 'lifecare-journal-note-bodies' : 'lifecare-document-bodies'}`
    )
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Saves an edit to a Lifecare record. */
export const updateLifecareRecord = (
  errandId: string,
  category: LifecareRecordCategory,
  id: string,
  edit: LifecareRecordEdit
): Promise<ServiceResponse<LifecareRecordContent>> =>
  apiService
    .put<ApiResponse<LifecareRecordContent>>(`errands/${errandId}/lifecare-documents/${pathFor(category)}/${id}`, edit)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** The note types a new journalanteckning on the insats of the errand can have, as Lifecare lists them. */
export const getLifecareJournalNoteTypes = (errandId: string): Promise<ServiceResponse<LifecareNoteTypeView[]>> =>
  apiService
    .get<LifecareNoteTypesApiResponse>(`errands/${errandId}/lifecare-documents/journal-note-types`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/**
 * Writes a new journalanteckning straight to the insats of the errand in Lifecare. There is no copy
 * anywhere else, so on a rejection (`error`, with Lifecare's reason in `message`) the text only lives in
 * the form the handläggare is still looking at.
 */
export const createLifecareJournalNote = (
  errandId: string,
  input: CreateLifecareJournalNoteDto
): Promise<ServiceResponse<null>> =>
  apiService
    .post<ApiResponse>(`errands/${errandId}/lifecare-documents/journal-notes`, input)
    .then(() => ({ data: null }))
    .catch(toServiceError);

/** The document types a new document on the insats of the errand can have, as Lifecare lists them. */
export const getLifecareDocumentTypes = (errandId: string): Promise<ServiceResponse<LifecareDocumentTypeView[]>> =>
  apiService
    .get<LifecareDocumentTypesApiResponse>(`errands/${errandId}/lifecare-documents/document-types`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/**
 * Writes a new document straight to the insats of the errand in Lifecare. As with journalanteckningar,
 * there is no copy anywhere else, so on a rejection the text only lives in the open form.
 */
export const createLifecareDocument = (
  errandId: string,
  input: CreateLifecareDocumentDto
): Promise<ServiceResponse<null>> =>
  apiService
    .post<ApiResponse>(`errands/${errandId}/lifecare-documents/documents`, input)
    .then(() => ({ data: null }))
    .catch(toServiceError);
