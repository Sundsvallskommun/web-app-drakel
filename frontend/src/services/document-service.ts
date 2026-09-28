import { DocumentType, DocumentTypesApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';

/**
 * Fetches the selectable dokument types (Lifecare 'Typ'/Dokumenttyp catalogue), used by the template admin.
 *
 * The documents themselves are now read from and written to Lifecare directly (see
 * lifecare-documents-service). This catalogue survives because the template admin tags each document
 * template with the type code it belongs to — and it, too, goes away once templates come from Lifecare.
 */
export const getDocumentTypes = (): Promise<ServiceResponse<DocumentType[]>> =>
  unwrapData(apiService.get<DocumentTypesApiResponse>('documents/types'));
