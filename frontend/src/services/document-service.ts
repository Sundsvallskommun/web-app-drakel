import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * A selectable dokument type (Lifecare 'Typ'/Dokumenttyp catalogue).
 *
 * The documents themselves are now read from and written to Lifecare directly (see
 * lifecare-documents-service). This catalogue survives because the template admin tags each document
 * template with the type code it belongs to — and it, too, goes away once templates come from Lifecare.
 */
export interface DocumentType {
  code?: string;
  displayName?: string;
}

/** Fetches the selectable document types (used by the template admin). */
export const getDocumentTypes = (): Promise<ServiceResponse<DocumentType[]>> =>
  apiService
    .get<ApiResponse<DocumentType[]>>('documents/types')
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
