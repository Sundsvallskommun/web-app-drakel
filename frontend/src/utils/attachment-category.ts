import { Attachment } from '@data-contracts/backend/data-contracts';

/** caremanagement's attachment documentTypes that have a category label (`attachments:category.documentType.*`). */
const CATEGORISED_DOCUMENT_TYPES = ['APPLICATION', 'GENERATED', 'ERRAND', 'CASE_DATA', 'DECISION', 'MESSAGE_HISTORY'];

/** Conversation files are categorised by who sent them rather than by documentType. */
const CATEGORISED_SENDER_ROLES = ['CLIENT', 'CASEWORKER'];

/**
 * The translation key (under `attachments:category`) of an attachment's category label, shown after the file
 * name, e.g. "documentType.APPLICATION" or "senderRole.CLIENT"; undefined when the category is unknown.
 */
export const attachmentCategoryKey = (attachment: Attachment): string | undefined => {
  if (attachment.documentType === 'CONVERSATION') {
    const senderRole = attachment.senderRole ?? '';
    return CATEGORISED_SENDER_ROLES.includes(senderRole) ? `senderRole.${senderRole}` : 'conversation';
  }
  const documentType = attachment.documentType ?? '';
  return CATEGORISED_DOCUMENT_TYPES.includes(documentType) ? `documentType.${documentType}` : undefined;
};
