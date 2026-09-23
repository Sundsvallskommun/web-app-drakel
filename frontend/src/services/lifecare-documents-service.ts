import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** Which group a Lifecare record belongs to. */
type LifecareRecordCategory = 'JOURNAL_NOTE' | 'DOCUMENT';

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

/** Fetches one Lifecare record with its body. */
export const getLifecareRecordContent = (
  category: LifecareRecordCategory,
  id: string
): Promise<ServiceResponse<LifecareRecordContent>> =>
  apiService
    .get<ApiResponse<LifecareRecordContent>>(`lifecare-documents/${pathFor(category)}/${id}`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Saves an edit to a Lifecare record. */
export const updateLifecareRecord = (
  category: LifecareRecordCategory,
  id: string,
  edit: LifecareRecordEdit
): Promise<ServiceResponse<LifecareRecordContent>> =>
  apiService
    .put<ApiResponse<LifecareRecordContent>>(`lifecare-documents/${pathFor(category)}/${id}`, edit)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
