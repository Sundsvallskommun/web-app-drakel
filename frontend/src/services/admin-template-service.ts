import { AdminTemplate, AdminTemplateDetail } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

export type { AdminTemplate, AdminTemplateDetail };

/** The fields sent when saving a mall or frastext. Without an identifier a new template is created. */
export interface SaveTemplateInput {
  identifier?: string;
  name: string;
  description?: string;
  code: string;
  kind: string;
  content: string;
}

/** Lists every mall and frastext this app owns, across both journalanteckning and dokument. */
export const getAdminTemplates = (): Promise<ServiceResponse<AdminTemplate[]>> =>
  apiService
    .get<ApiResponse<AdminTemplate[]>>('admin/templates')
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Fetches a single template with its HTML content, for the editor. */
export const getAdminTemplate = (identifier: string): Promise<ServiceResponse<AdminTemplateDetail>> =>
  apiService
    .get<ApiResponse<AdminTemplateDetail>>(`admin/templates/${encodeURIComponent(identifier)}`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Saves a template and returns the refreshed list. */
export const saveAdminTemplate = (input: SaveTemplateInput): Promise<ServiceResponse<AdminTemplate[]>> =>
  apiService
    .post<ApiResponse<AdminTemplate[]>>('admin/templates', input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Deletes a template and all of its versions. */
export const deleteAdminTemplate = (identifier: string): Promise<ServiceResponse<boolean>> =>
  apiService
    .delete(`admin/templates/${encodeURIComponent(identifier)}`)
    .then(() => ({ data: true }))
    .catch(toServiceError);
