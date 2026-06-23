import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** A Dokument (formal case document) on an errand. Defined locally mirroring the backend response. */
export interface Document {
  id?: string;
  errandId?: string;
  /** Document type (Lifecare 'Typ'/Dokumenttyp). */
  type?: string;
  heading?: string;
  text?: string;
  documentDate?: string;
  documentTime?: string;
  /** WORKING = editable draft, LOCKED = upprättad handling. */
  status?: 'WORKING' | 'LOCKED';
  createdBy?: string;
  created?: string;
  modifiedBy?: string;
  modified?: string;
  lockedBy?: string;
  locked?: string;
}

/** A selectable document type (Lifecare 'Typ'/Dokumenttyp catalogue). */
export interface DocumentType {
  code?: string;
  displayName?: string;
}

/** The fields sent when creating or editing a dokument. */
export interface DocumentInput {
  type: string;
  heading: string;
  text?: string;
  documentDate: string;
  documentTime?: string;
}

/** Fetches the dokument on an errand. */
export const getDocuments = (errandId: string): Promise<ServiceResponse<Document[]>> =>
  apiService
    .get<ApiResponse<Document[]>>(`errands/${errandId}/documents`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Fetches the selectable document types. */
export const getDocumentTypes = (): Promise<ServiceResponse<DocumentType[]>> =>
  apiService
    .get<ApiResponse<DocumentType[]>>('documents/types')
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Creates a dokument. */
export const createDocument = (errandId: string, input: DocumentInput): Promise<ServiceResponse<Document>> =>
  apiService
    .post<ApiResponse<Document>>(`errands/${errandId}/documents`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Edits a WORKING dokument. */
export const updateDocument = (
  errandId: string,
  documentId: string,
  input: DocumentInput
): Promise<ServiceResponse<Document>> =>
  apiService
    .patch<ApiResponse<Document>>(`errands/${errandId}/documents/${documentId}`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Locks a dokument into an upprättad handling. */
export const lockDocument = (errandId: string, documentId: string): Promise<ServiceResponse<Document>> =>
  apiService
    .post<ApiResponse<Document>>(`errands/${errandId}/documents/${documentId}/lock`, {})
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Deletes a dokument. */
export const deleteDocument = (errandId: string, documentId: string): Promise<ServiceResponse<null>> =>
  apiService
    .delete<ApiResponse<null>>(`errands/${errandId}/documents/${documentId}`)
    .then(() => ({ data: null }))
    .catch(toServiceError);
