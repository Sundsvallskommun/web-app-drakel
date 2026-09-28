import {
  Attachment,
  AttachmentsApiResponse,
  Errand,
  ErrandApiResponse,
  ErrandsApiResponse,
  FindErrandsQueryDto,
  FindErrandsResult,
  Message,
  MessagesApiResponse,
  PatchErrandDto,
  Stakeholder,
  StakeholdersApiResponse,
} from '@data-contracts/backend/data-contracts';
import { FinancialAssistanceData } from '@interfaces/financial-assistance';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, discardData, toServiceError, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';
import { objectUrlAs } from '@utils/pdf-object-url';

/**
 * A conversation message on an errand. `direction` is INBOUND (applicant → handläggare) or OUTBOUND (handläggare
 * → applicant); `inReplyToId` is the message it replies to, always on the same errand.
 */
export type { Message };

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
  if (query.hasUnhandledNotifications) {
    params.hasUnhandledNotifications = true;
  }
  return params;
};

/**
 * Fetches a paged list of caremanagement errands from the backend proxy. Several sort orders go as repeated
 * `sort=` parameters (Spring's convention) — axios would otherwise send them as `sort[]=`, which the backend
 * never reads.
 */
export const getErrands = (query: FindErrandsQueryDto = {}): Promise<ServiceResponse<FindErrandsResult>> =>
  unwrapData(
    apiService.get<ErrandsApiResponse>('errands', { params: buildParams(query), paramsSerializer: { indexes: null } })
  );

/** Fetches a single errand by id or errand number. The errand includes its embedded stakeholders. */
export const getErrand = (errandId: string): Promise<ServiceResponse<Errand>> =>
  unwrapData(apiService.get<ErrandApiResponse>(apiPath`errands/${errandId}`));

/**
 * Fetches the submitted financial-assistance application data for an errand. Comes from the
 * financial-assistance view (the generic errand GET omits the data payload). Null for non-FA errands.
 */
export const getApplicationData = (errandId: string): Promise<ServiceResponse<FinancialAssistanceData | null>> =>
  unwrapData(apiService.get<ApiResponse<FinancialAssistanceData | null>>(apiPath`errands/${errandId}/application`));

/**
 * Creates an empty draft errand on the backend (which assigns the current handläggare as
 * reporter/assignee) and returns it. Used by the "register new errand" flow.
 */
export const initiateErrand = (): Promise<ServiceResponse<Errand>> =>
  unwrapData(apiService.post<ErrandApiResponse>('errands/initiate', {}));

/** Fetches the stakeholders belonging to an errand (the dedicated list endpoint). */
export const getErrandStakeholders = (errandId: string): Promise<ServiceResponse<Stakeholder[]>> =>
  unwrapData(apiService.get<StakeholdersApiResponse>(apiPath`errands/${errandId}/stakeholders`));

/** Updates an errand (PATCH) and returns the updated errand. */
export const updateErrand = (errandId: string, patch: PatchErrandDto): Promise<ServiceResponse<Errand>> =>
  unwrapData(apiService.patch<ErrandApiResponse>(apiPath`errands/${errandId}`, patch));

/** Fetches the attachments belonging to an errand. */
export const getErrandAttachments = (errandId: string): Promise<ServiceResponse<Attachment[]>> =>
  unwrapData(apiService.get<AttachmentsApiResponse>(apiPath`errands/${errandId}/attachments`));

/**
 * Fetches a streamed file from the backend and triggers a browser "save as". Shared by every
 * download flow so the blob/object-URL/anchor dance lives in exactly one place. The object URL is typed as a
 * plain byte stream, so whatever the file claims to be it is only ever saved, never rendered.
 */
const downloadBlob = async (path: string, fileName?: string): Promise<void> => {
  const res = await apiService.get<Blob>(path, { responseType: 'blob' });
  const url = objectUrlAs(res.data, 'application/octet-stream');
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
  downloadBlob(apiPath`errands/${errandId}/attachments/${attachmentId}/file`, fileName);

/** Fetches an attachment's file as a Blob — used for inline preview (e.g. PDF i iframe). */
export const getAttachmentBlob = (errandId: string, attachmentId: string): Promise<Blob> =>
  apiService
    .get<Blob>(apiPath`errands/${errandId}/attachments/${attachmentId}/file`, { responseType: 'blob' })
    .then((res) => res.data);

/** An attachment's file as a ServiceResponse — for a preview that shows why it failed rather than throwing. */
export const getAttachmentFile = (errandId: string, attachmentId: string): Promise<ServiceResponse<Blob>> =>
  getAttachmentBlob(errandId, attachmentId)
    .then((file) => ({ data: file }))
    .catch(toServiceError);

/** Fetches a conversation message attachment's file as a Blob — used for inline preview. */
const getMessageAttachmentBlob = (errandId: string, messageId: string, attachmentId: string): Promise<Blob> =>
  apiService
    .get<Blob>(apiPath`errands/${errandId}/messages/${messageId}/attachments/${attachmentId}/file`, {
      responseType: 'blob',
    })
    .then((res) => res.data);

/**
 * True for files that live on a conversation message. caremanagement returns every file in one unified
 * attachment list tagged with a `documentType`; CONVERSATION files must be downloaded via the message
 * endpoint (using their `messageId`), everything else via the plain errand attachment endpoint.
 */
const isConversationAttachment = (attachment: Attachment): boolean =>
  attachment.documentType === 'CONVERSATION' && !!attachment.messageId;

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

/** Fetches an errand's conversation messages (returned chronologically by the backend). */
export const getErrandMessages = (errandId: string): Promise<ServiceResponse<Message[]>> =>
  unwrapData(apiService.get<MessagesApiResponse>(apiPath`errands/${errandId}/messages`));

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
  return discardData(apiService.post(apiPath`errands/${errandId}/messages`, form, { headers: {} }));
};

/** Downloads a single attachment on a conversation message (the backend streams it). */
export const downloadMessageAttachment = (
  errandId: string,
  messageId: string,
  attachmentId: string,
  fileName?: string
): Promise<void> =>
  downloadBlob(apiPath`errands/${errandId}/messages/${messageId}/attachments/${attachmentId}/file`, fileName);
