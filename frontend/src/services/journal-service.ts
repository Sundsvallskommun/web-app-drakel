import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** A journalanteckning (case-journal entry) on an errand. Defined locally mirroring the backend response. */
export interface JournalEntry {
  id?: string;
  errandId?: string;
  /** Journal entry type (Lifecare 'Typ'). */
  type?: string;
  heading?: string;
  text?: string;
  entryDate?: string;
  entryTime?: string;
  /** WORKING = editable arbetsanteckning, LOCKED = upprättad handling. */
  status?: 'WORKING' | 'LOCKED';
  createdBy?: string;
  created?: string;
  updated?: string;
}

/** A selectable journal entry type (Lifecare 'Typ' catalogue). */
export interface JournalEntryType {
  code?: string;
  displayName?: string;
}

/** The fields sent when creating or editing a journalanteckning. */
export interface JournalEntryInput {
  type: string;
  heading: string;
  text?: string;
  entryDate: string;
  entryTime?: string;
}

/** Fetches the journalanteckningar on an errand. */
export const getJournalEntries = (errandId: string): Promise<ServiceResponse<JournalEntry[]>> =>
  apiService
    .get<ApiResponse<JournalEntry[]>>(`errands/${errandId}/journal-entries`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Fetches the selectable journal entry types. */
export const getJournalTypes = (): Promise<ServiceResponse<JournalEntryType[]>> =>
  apiService
    .get<ApiResponse<JournalEntryType[]>>('journal-entries/types')
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Creates a journalanteckning. */
export const createJournalEntry = (errandId: string, input: JournalEntryInput): Promise<ServiceResponse<JournalEntry>> =>
  apiService
    .post<ApiResponse<JournalEntry>>(`errands/${errandId}/journal-entries`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Edits a WORKING journalanteckning. */
export const updateJournalEntry = (
  errandId: string,
  entryId: string,
  input: JournalEntryInput
): Promise<ServiceResponse<JournalEntry>> =>
  apiService
    .patch<ApiResponse<JournalEntry>>(`errands/${errandId}/journal-entries/${entryId}`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Locks a journalanteckning into an upprättad handling. */
export const lockJournalEntry = (errandId: string, entryId: string): Promise<ServiceResponse<JournalEntry>> =>
  apiService
    .post<ApiResponse<JournalEntry>>(`errands/${errandId}/journal-entries/${entryId}/lock`, {})
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Deletes a journalanteckning. */
export const deleteJournalEntry = (errandId: string, entryId: string): Promise<ServiceResponse<null>> =>
  apiService
    .delete<ApiResponse<null>>(`errands/${errandId}/journal-entries/${entryId}`)
    .then(() => ({ data: null }))
    .catch(toServiceError);
