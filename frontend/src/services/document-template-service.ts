import { DocumentTemplateContentApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, mapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/** Fetches a template's decoded HTML content for the editor. */
export const getDocumentTemplateContent = (identifier: string): Promise<ServiceResponse<string>> =>
  mapData(
    apiService.get<DocumentTemplateContentApiResponse>(apiPath`document-templates/${identifier}`),
    (template) => template.content
  );
