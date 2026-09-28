import { TreservaJournalApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/**
 * The applicant's journal migrated from Treserva, as a base64 PDF.
 * TODO(treserva-journal): the BFF serves a MOCK test PDF until the migrated journal is in Lifecare.
 */
export const getTreservaJournal = (errandId: string): Promise<ServiceResponse<string>> =>
  unwrapData(apiService.get<TreservaJournalApiResponse>(apiPath`errands/${errandId}/treserva-journal`));
