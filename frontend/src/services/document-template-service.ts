import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** Fetches a template's decoded HTML content for the editor. */
export const getDocumentTemplateContent = (identifier: string): Promise<ServiceResponse<string>> =>
  apiService
    .get<ApiResponse<{ content: string }>>(`document-templates/${encodeURIComponent(identifier)}`)
    .then((res) => ({ data: res.data.data.content }))
    .catch(toServiceError);
