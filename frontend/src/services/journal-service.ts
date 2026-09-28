import { JournalEntryType, JournalEntryTypesApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';

/**
 * Fetches the selectable journalanteckning types (Lifecare 'Typ' catalogue), used by the template admin.
 *
 * The journalanteckningar themselves are now read from and written to Lifecare directly (see
 * lifecare-documents-service). This catalogue survives because the template admin tags each journal
 * template with the type code it belongs to.
 */
export const getJournalTypes = (): Promise<ServiceResponse<JournalEntryType[]>> =>
  unwrapData(apiService.get<JournalEntryTypesApiResponse>('journal-entries/types'));
