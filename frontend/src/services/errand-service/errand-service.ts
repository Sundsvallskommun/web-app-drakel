import {
  Attachment,
  ContactChannel,
  Errand,
  FindErrandsQueryDto,
  FindErrandsResult,
  PatchErrandDto,
  Stakeholder,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** The fields accepted when adding a stakeholder (matches the backend CreateStakeholderDto). */
export interface NewStakeholder {
  role?: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  contactChannels?: ContactChannel[];
}

export const emptyErrandsResult: FindErrandsResult = { errands: [], _meta: {} };

/** Adds a stakeholder to an errand. The stakeholder is then available on the refetched errand. */
export const createStakeholder = (errandId: string, stakeholder: NewStakeholder): Promise<ServiceResponse<null>> => {
  return apiService
    .post<ApiResponse<null>>(`errands/${errandId}/stakeholders`, stakeholder)
    .then(() => ({ data: null }))
    .catch(toServiceError);
};

const buildParams = (query: FindErrandsQueryDto): Record<string, unknown> => {
  const params: Record<string, unknown> = {};
  if (query.filter) {
    params.filter = query.filter;
  }
  if (query.page !== undefined) {
    params.page = query.page;
  }
  if (query.size !== undefined) {
    params.size = query.size;
  }
  if (query.sort?.length) {
    params.sort = query.sort;
  }
  return params;
};

/** Fetches a paged list of caremanagement errands from the backend proxy. */
export const getErrands = (query: FindErrandsQueryDto = {}): Promise<ServiceResponse<FindErrandsResult>> => {
  return apiService
    .get<ApiResponse<FindErrandsResult>>('errands', { params: buildParams(query) })
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

/** Fetches a single errand by id. The errand includes its embedded stakeholders. */
export const getErrand = (errandId: string): Promise<ServiceResponse<Errand>> => {
  return apiService
    .get<ApiResponse<Errand>>(`errands/${errandId}`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

/** Creates a new errand and returns it (including its server-assigned id). */
export const createErrand = (payload: PatchErrandDto): Promise<ServiceResponse<Errand>> => {
  return apiService
    .post<ApiResponse<Errand>>('errands', payload)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

/**
 * Creates an empty draft errand on the backend (which assigns the current handläggare as
 * reporter/assignee) and returns it. Used by the "register new errand" flow.
 */
export const initiateErrand = (): Promise<ServiceResponse<Errand>> => {
  return apiService
    .post<ApiResponse<Errand>>('errands/initiate', {})
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

/** Fetches the stakeholders belonging to an errand (the dedicated list endpoint). */
export const getErrandStakeholders = (errandId: string): Promise<ServiceResponse<Stakeholder[]>> => {
  return apiService
    .get<ApiResponse<Stakeholder[]>>(`errands/${errandId}/stakeholders`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

/** Updates an errand (PATCH) and returns the updated errand. */
export const updateErrand = (errandId: string, patch: PatchErrandDto): Promise<ServiceResponse<Errand>> => {
  return apiService
    .patch<ApiResponse<Errand>>(`errands/${errandId}`, patch)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

/** Fetches the attachments belonging to an errand. */
export const getErrandAttachments = (errandId: string): Promise<ServiceResponse<Attachment[]>> => {
  return apiService
    .get<ApiResponse<Attachment[]>>(`errands/${errandId}/attachments`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

/** Downloads an attachment's file (the backend streams it) and triggers a browser save. */
export const downloadAttachment = async (errandId: string, attachmentId: string, fileName?: string): Promise<void> => {
  const res = await apiService.get<Blob>(`errands/${errandId}/attachments/${attachmentId}/file`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName ?? 'bilaga';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/** Uploads a file as a new attachment on an errand (multipart). */
export const uploadAttachment = (errandId: string, file: File): Promise<ServiceResponse<null>> => {
  const form = new FormData();
  form.append('file', file);
  // Empty headers let axios set the multipart boundary instead of the default JSON content-type.
  return apiService
    .post<ApiResponse<null>>(`errands/${errandId}/attachments`, form, { headers: {} })
    .then(() => ({ data: null }))
    .catch(toServiceError);
};
