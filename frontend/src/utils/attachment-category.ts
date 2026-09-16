import { Attachment } from '@data-contracts/backend/data-contracts';

/** Short Swedish category labels for caremanagement's attachment documentTypes, shown after the file name. */
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  APPLICATION: 'ansökan',
  GENERATED: 'genererad',
  ERRAND: 'ärende',
  CASE_DATA: 'ärendeuppgifter',
  DECISION: 'beslut',
  MESSAGE_HISTORY: 'meddelandehistorik',
};

/** Conversation files are categorised by who sent them rather than by documentType. */
const SENDER_ROLE_LABELS: Record<string, string> = {
  CLIENT: 'från sökande',
  CASEWORKER: 'från handläggare',
};

/** The category label for an attachment, e.g. "ansökan" or "från sökande"; undefined when unknown. */
export const attachmentCategoryLabel = (attachment: Attachment): string | undefined => {
  if (attachment.documentType === 'CONVERSATION') {
    return SENDER_ROLE_LABELS[attachment.senderRole ?? ''] ?? 'meddelande';
  }
  return DOCUMENT_TYPE_LABELS[attachment.documentType ?? ''];
};
