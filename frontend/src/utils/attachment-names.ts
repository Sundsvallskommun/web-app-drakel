import { Attachment } from '@data-contracts/backend/data-contracts';

/** The application summary PDF caremanagement generates (documentType GENERATED) — previewed in the Bilagor tab. */
const SUMMARY_PDF = 'sammanstallning.pdf';

/**
 * The consolidated client conversation files PDF — previewed in the "Bilagor från meddelanden" tab.
 * caremanagement rebuilds it whenever the client sends a new file.
 */
const CLIENT_FILES_PDF = 'klientbilagor.pdf';

const hasFileName = (attachment: Attachment, fileName: string): boolean =>
  (attachment.fileName ?? '').toLowerCase() === fileName;

/**
 * The official application summary. Picked by name AND by documentType: a citizen can upload a file of any name,
 * and an upload called sammanstallning.pdf must not pose as the platform's summary.
 */
export const isSummaryPdf = (attachment: Attachment): boolean =>
  hasFileName(attachment, SUMMARY_PDF) && attachment.documentType === 'GENERATED';

/**
 * The consolidated client files PDF. The platform files it as a conversation document (or a generated one) that
 * belongs to no message — it is read through the plain attachment endpoint. A file the citizen sent is either an
 * application file (APPLICATION) or sits on a message (a messageId), so neither can pose as it by name alone.
 */
export const isClientFilesPdf = (attachment: Attachment): boolean =>
  hasFileName(attachment, CLIENT_FILES_PDF) &&
  (attachment.documentType === 'CONVERSATION' || attachment.documentType === 'GENERATED') &&
  !attachment.messageId;
