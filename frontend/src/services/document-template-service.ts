import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** A selectable template (document or phrase) for the new-document editor. */
export interface DocumentTemplateOption {
  identifier?: string;
  name?: string;
}

/** The templates available for a document type, split into full documents and insertable phrases. */
export interface DocumentTemplates {
  documents: DocumentTemplateOption[];
  phrases: DocumentTemplateOption[];
}

/** Lists the document + phrase templates for a document type code (e.g. LETTER). */
export const getDocumentTemplates = (code: string): Promise<ServiceResponse<DocumentTemplates>> =>
  apiService
    .get<ApiResponse<DocumentTemplates>>(`document-templates?code=${encodeURIComponent(code)}`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Fetches a template's decoded HTML content for the editor. */
export const getDocumentTemplateContent = (identifier: string): Promise<ServiceResponse<string>> =>
  apiService
    .get<ApiResponse<{ content: string }>>(`document-templates/${encodeURIComponent(identifier)}`)
    .then((res) => ({ data: res.data.data.content }))
    .catch(toServiceError);
