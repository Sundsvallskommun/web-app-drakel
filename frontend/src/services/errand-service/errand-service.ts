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

/**
 * A file attached to a conversation message. Returned alongside each message by the backend and
 * downloaded individually via {@link downloadMessageAttachment}.
 */
interface MessageAttachment {
  id?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

/**
 * A conversation message on an errand. Mirrors the backend Message response; defined locally (like
 * {@link NewStakeholder}) until the backend data-contract is regenerated with the message types.
 */
export interface Message {
  id?: string;
  errandId?: string;
  /** INBOUND = applicant → handläggare, OUTBOUND = handläggare → applicant. */
  direction?: 'INBOUND' | 'OUTBOUND';
  body?: string;
  author?: string;
  created?: string;
  attachments?: MessageAttachment[];
}

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

/**
 * Fetches a streamed file from the backend and triggers a browser "save as". Shared by every
 * download flow so the blob/object-URL/anchor dance lives in exactly one place.
 */
const downloadBlob = async (path: string, fileName?: string): Promise<void> => {
  const res = await apiService.get<Blob>(path, { responseType: 'blob' });
  const url = window.URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName ?? 'bilaga';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/** Downloads an attachment's file (the backend streams it) and triggers a browser save. */
export const downloadAttachment = (errandId: string, attachmentId: string, fileName?: string): Promise<void> =>
  downloadBlob(`errands/${errandId}/attachments/${attachmentId}/file`, fileName);

/** Fetches an attachment's file as a Blob — used for inline preview (e.g. PDF i iframe). */
export const getAttachmentBlob = (errandId: string, attachmentId: string): Promise<Blob> =>
  apiService.get<Blob>(`errands/${errandId}/attachments/${attachmentId}/file`, { responseType: 'blob' }).then((res) => res.data);

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

/** Fetches an errand's conversation messages (returned chronologically by the backend). */
export const getErrandMessages = (errandId: string): Promise<ServiceResponse<Message[]>> => {
  return apiService
    .get<ApiResponse<Message[]>>(`errands/${errandId}/messages`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

/**
 * Posts a message (with optional file attachments) to an errand's conversation. Sent as multipart:
 * a `body` text field plus zero or more `files`. The backend marks it OUTBOUND and stamps the author
 * from the session, so the handläggare only supplies the text and files.
 */
export const postErrandMessage = (
  errandId: string,
  body: string,
  files: File[] = []
): Promise<ServiceResponse<null>> => {
  const form = new FormData();
  form.append('body', body);
  files.forEach((file) => {
    form.append('files', file);
  });
  // Empty headers let axios set the multipart boundary instead of the default JSON content-type.
  return apiService
    .post<ApiResponse<null>>(`errands/${errandId}/messages`, form, { headers: {} })
    .then(() => ({ data: null }))
    .catch(toServiceError);
};

/** Downloads a single attachment on a conversation message (the backend streams it). */
export const downloadMessageAttachment = (
  errandId: string,
  messageId: string,
  attachmentId: string,
  fileName?: string
): Promise<void> =>
  downloadBlob(`errands/${errandId}/messages/${messageId}/attachments/${attachmentId}/file`, fileName);
