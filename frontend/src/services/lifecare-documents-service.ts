import {
  CreateLifecareDocumentDto,
  CreateLifecareJournalNoteDto,
  LifecareDocumentTypesApiResponse,
  LifecareDocumentTypeView,
  LifecareNoteTypesApiResponse,
  LifecareNoteTypeView,
  LifecareRecordBodiesApiResponse,
  LifecareRecordBodyView,
  LifecareRecordContentApiResponse,
  LifecareRecordContentView,
  LifecareRecordsView,
  LifecareRecordView,
  UpdateLifecareRecordDto,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, discardData, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/** Which group a Lifecare record belongs to. */
export type LifecareRecordCategory = 'JOURNAL_NOTE' | 'DOCUMENT';

/**
 * A Lifecare record — a journalanteckning or a document — with its category narrowed to the two groups, since
 * the category picks the endpoint the record is opened and saved through.
 */
export type LifecareRecord = LifecareRecordView & { category: LifecareRecordCategory };

/** A person's Lifecare record, split into the two groups the tab shows. */
export type LifecareRecords = { [Group in keyof LifecareRecordsView]: LifecareRecord[] };

/** The BFF path segment for a record kind. */
const pathFor = (category: LifecareRecordCategory): string =>
  category === 'JOURNAL_NOTE' ? 'journal-notes' : 'documents';

/** Fetches the applicant's Lifecare record (journalanteckningar and documents) for an errand. */
export const getLifecareRecords = (errandId: string): Promise<ServiceResponse<LifecareRecords>> =>
  unwrapData(apiService.get<ApiResponse<LifecareRecords>>(apiPath`errands/${errandId}/lifecare-documents`));

/** Fetches one Lifecare record with its body. Read through the errand, so the read is logged on it. */
export const getLifecareRecordContent = (
  errandId: string,
  category: LifecareRecordCategory,
  id: string
): Promise<ServiceResponse<LifecareRecordContentView>> =>
  unwrapData(
    apiService.get<LifecareRecordContentApiResponse>(
      apiPath`errands/${errandId}/lifecare-documents/${pathFor(category)}/${id}`
    )
  );

/**
 * The bodies of every record in one group, so the tab can show their text without opening each one.
 * Lifecare reads them one by one behind this call, so it answers after the list itself.
 */
export const getLifecareRecordBodies = (
  errandId: string,
  category: LifecareRecordCategory
): Promise<ServiceResponse<LifecareRecordBodyView[]>> =>
  unwrapData(
    apiService.get<LifecareRecordBodiesApiResponse>(
      category === 'JOURNAL_NOTE' ?
        apiPath`errands/${errandId}/lifecare-journal-note-bodies`
      : apiPath`errands/${errandId}/lifecare-document-bodies`
    )
  );

/** Saves an edit to a Lifecare record. */
export const updateLifecareRecord = (
  errandId: string,
  category: LifecareRecordCategory,
  id: string,
  edit: UpdateLifecareRecordDto
): Promise<ServiceResponse<LifecareRecordContentView>> =>
  unwrapData(
    apiService.put<LifecareRecordContentApiResponse>(
      apiPath`errands/${errandId}/lifecare-documents/${pathFor(category)}/${id}`,
      edit
    )
  );

/** The note types a new journalanteckning on the insats of the errand can have, as Lifecare lists them. */
export const getLifecareJournalNoteTypes = (errandId: string): Promise<ServiceResponse<LifecareNoteTypeView[]>> =>
  unwrapData(
    apiService.get<LifecareNoteTypesApiResponse>(apiPath`errands/${errandId}/lifecare-documents/journal-note-types`)
  );

/**
 * Writes a new journalanteckning straight to the insats of the errand in Lifecare. There is no copy
 * anywhere else, so on a rejection (`error`, with Lifecare's reason in `message`) the text only lives in
 * the form the handläggare is still looking at.
 */
export const createLifecareJournalNote = (
  errandId: string,
  input: CreateLifecareJournalNoteDto
): Promise<ServiceResponse<null>> =>
  discardData(apiService.post(apiPath`errands/${errandId}/lifecare-documents/journal-notes`, input));

/** The document types a new document on the insats of the errand can have, as Lifecare lists them. */
export const getLifecareDocumentTypes = (errandId: string): Promise<ServiceResponse<LifecareDocumentTypeView[]>> =>
  unwrapData(
    apiService.get<LifecareDocumentTypesApiResponse>(apiPath`errands/${errandId}/lifecare-documents/document-types`)
  );

/**
 * Writes a new document straight to the insats of the errand in Lifecare. As with journalanteckningar,
 * there is no copy anywhere else, so on a rejection the text only lives in the open form.
 */
export const createLifecareDocument = (
  errandId: string,
  input: CreateLifecareDocumentDto
): Promise<ServiceResponse<null>> =>
  discardData(apiService.post(apiPath`errands/${errandId}/lifecare-documents/documents`, input));
