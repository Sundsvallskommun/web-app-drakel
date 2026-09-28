import {
  AdminTemplate,
  AdminTemplateApiResponse,
  AdminTemplateDetail,
  AdminTemplatesApiResponse,
  SaveTemplateDto,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

export type { AdminTemplate, AdminTemplateDetail };

/** Lists every mall and frastext this app owns, across both journalanteckning and dokument. */
export const getAdminTemplates = (): Promise<ServiceResponse<AdminTemplate[]>> =>
  unwrapData(apiService.get<AdminTemplatesApiResponse>('admin/templates'));

/** Fetches a single template with its HTML content, for the editor. */
export const getAdminTemplate = (identifier: string): Promise<ServiceResponse<AdminTemplateDetail>> =>
  unwrapData(apiService.get<AdminTemplateApiResponse>(apiPath`admin/templates/${identifier}`));

/** Saves a mall or frastext and returns the refreshed list. Without an identifier a new template is created. */
export const saveAdminTemplate = (input: SaveTemplateDto): Promise<ServiceResponse<AdminTemplate[]>> =>
  unwrapData(apiService.post<AdminTemplatesApiResponse>('admin/templates', input));

/** Deletes a template and all of its versions. */
export const deleteAdminTemplate = (identifier: string): Promise<ServiceResponse<boolean>> =>
  apiService
    .delete(apiPath`admin/templates/${identifier}`)
    .then(() => ({ data: true }))
    .catch(toServiceError);

/** Puts the default beslutsformuleringar Templating lacks there — never duplicating or overwriting one. */
export const addDefaultDecisionPhrases = (): Promise<ServiceResponse<AdminTemplate[]>> =>
  unwrapData(apiService.post<AdminTemplatesApiResponse>('admin/templates/decision-phrases/defaults', {}));
