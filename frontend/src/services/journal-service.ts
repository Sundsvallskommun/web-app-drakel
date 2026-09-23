import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * A selectable journalanteckning type (Lifecare 'Typ' catalogue).
 *
 * The journalanteckningar themselves are now read from and written to Lifecare directly (see
 * lifecare-documents-service). This catalogue survives because the template admin tags each journal
 * template with the type code it belongs to.
 */
export interface JournalEntryType {
  code?: string;
  displayName?: string;
}

/** Fetches the selectable journal entry types (used by the template admin). */
export const getJournalTypes = (): Promise<ServiceResponse<JournalEntryType[]>> =>
  apiService
    .get<ApiResponse<JournalEntryType[]>>('journal-entries/types')
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
