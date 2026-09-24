import { TreservaJournalApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/**
 * The applicant's journal migrated from Treserva, as a base64 PDF.
 * TODO(treserva-journal): the BFF serves a MOCK test PDF until the migrated journal is in Lifecare.
 */
export const getTreservaJournal = (errandId: string): Promise<ServiceResponse<string>> =>
  apiService
    .get<TreservaJournalApiResponse>(`errands/${errandId}/treserva-journal`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
