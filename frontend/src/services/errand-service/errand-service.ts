import {
  Attachment,
  Errand,
  FindErrandsQueryDto,
  FindErrandsResult,
  PatchErrandDto,
  Stakeholder,
} from '@data-contracts/backend/data-contracts';
import { FinancialAssistanceData } from '@interfaces/financial-assistance';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

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
  /** Id of the message this one replies to, when it is a reply (always on the same errand). */
  inReplyToId?: string;
  created?: string;
  attachments?: MessageAttachment[];
}

/** The generated FindErrandsQueryDto plus the notification filter (not yet in the regenerated contract). */
export type ErrandsQuery = FindErrandsQueryDto & { hasUnacknowledgedNotifications?: boolean };

const buildParams = (query: ErrandsQuery): Record<string, unknown> => {
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
  if (query.hasUnacknowledgedNotifications) {
    params.hasUnacknowledgedNotifications = true;
  }
  return params;
};

/** Fetches a paged list of caremanagement errands from the backend proxy. */
export const getErrands = (query: ErrandsQuery = {}): Promise<ServiceResponse<FindErrandsResult>> => {
  return apiService
    .get<ApiResponse<FindErrandsResult>>('errands', { params: buildParams(query) })
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

/** Fetches a single errand by id or errand number. The errand includes its embedded stakeholders. */
export const getErrand = (errandId: string): Promise<ServiceResponse<Errand>> => {
  return apiService
    .get<ApiResponse<Errand>>(`errands/${errandId}`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
};

/**
 * Fetches the submitted financial-assistance application data for an errand. Comes from the
 * financial-assistance view (the generic errand GET omits the data payload). Null for non-FA errands.
 */
export const getApplicationData = (errandId: string): Promise<ServiceResponse<FinancialAssistanceData | null>> => {
  return apiService
    .get<ApiResponse<FinancialAssistanceData | null>>(`errands/${errandId}/application`)
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
const downloadAttachment = (errandId: string, attachmentId: string, fileName?: string): Promise<void> =>
  downloadBlob(`errands/${errandId}/attachments/${attachmentId}/file`, fileName);

/** Fetches an attachment's file as a Blob — used for inline preview (e.g. PDF i iframe). */
export const getAttachmentBlob = (errandId: string, attachmentId: string): Promise<Blob> =>
  apiService
    .get<Blob>(`errands/${errandId}/attachments/${attachmentId}/file`, { responseType: 'blob' })
    .then((res) => res.data);

/** Fetches a conversation message attachment's file as a Blob — used for inline preview. */
const getMessageAttachmentBlob = (errandId: string, messageId: string, attachmentId: string): Promise<Blob> =>
  apiService
    .get<Blob>(`errands/${errandId}/messages/${messageId}/attachments/${attachmentId}/file`, { responseType: 'blob' })
    .then((res) => res.data);

/**
 * True for files that live on a conversation message. caremanagement returns every file in one unified
 * attachment list tagged with an `origin`; CONVERSATION files must be downloaded via the message
 * endpoint (using their `messageId`), everything else via the plain errand attachment endpoint.
 */
const isConversationAttachment = (attachment: Attachment): boolean =>
  attachment.origin === 'CONVERSATION' && !!attachment.messageId;

/** Downloads any unified attachment, routing conversation files through the message endpoint. */
export const downloadUnifiedAttachment = (errandId: string, attachment: Attachment): Promise<void> =>
  isConversationAttachment(attachment) && attachment.messageId ?
    downloadMessageAttachment(errandId, attachment.messageId, attachment.id ?? '', attachment.fileName)
  : downloadAttachment(errandId, attachment.id ?? '', attachment.fileName);

/** Fetches any unified attachment's file as a Blob (for inline image/PDF preview), routing conversation files. */
export const getUnifiedAttachmentBlob = (errandId: string, attachment: Attachment): Promise<Blob> =>
  isConversationAttachment(attachment) && attachment.messageId ?
    getMessageAttachmentBlob(errandId, attachment.messageId, attachment.id ?? '')
  : getAttachmentBlob(errandId, attachment.id ?? '');

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
 * from the session, so the handläggare only supplies the text, files and an optional reply target.
 *
 * `inReplyToId`, when set, is the id of the message being replied to (must be on the same errand).
 */
export const postErrandMessage = (
  errandId: string,
  body: string,
  files: File[] = [],
  inReplyToId?: string
): Promise<ServiceResponse<null>> => {
  const form = new FormData();
  form.append('body', body);
  files.forEach((file) => {
    form.append('files', file);
  });
  if (inReplyToId) {
    form.append('inReplyToId', inReplyToId);
  }
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
