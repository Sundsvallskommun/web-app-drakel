import { extname } from 'node:path';

import { UploadedFileLike } from '@interfaces/file.interface';

import { HttpException } from '@/exceptions/HttpException';

/** What a browser sends for a file whose type its system does not know — common for office files and Outlook's .msg. */
const UNKNOWN_BINARY = 'application/octet-stream';

const WORD = ['application/msword', UNKNOWN_BINARY];
const WORD_OPEN_XML = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', UNKNOWN_BINARY];
const EXCEL = ['application/vnd.ms-excel', UNKNOWN_BINARY];
const EXCEL_OPEN_XML = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', UNKNOWN_BINARY];

/**
 * The files a message to the sökande may carry, by extension, with the MIME types a browser sends for each. It is the
 * list the message form offers (sk-web-gui's FileUpload defaults) less HTML, which can carry script. The generic
 * `application/octet-stream` is accepted only where a browser commonly falls back to it; a file that claims a different
 * concrete type than its extension is refused.
 */
const MESSAGE_ATTACHMENT_TYPES: Record<string, readonly string[]> = {
  '.pdf': ['application/pdf'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.gif': ['image/gif'],
  '.png': ['image/png'],
  '.tif': ['image/tiff'],
  '.tiff': ['image/tiff'],
  '.bmp': ['image/bmp', 'image/x-ms-bmp'],
  '.txt': ['text/plain'],
  '.rtf': ['application/rtf', 'text/rtf', UNKNOWN_BINARY],
  '.doc': WORD,
  '.docx': WORD_OPEN_XML,
  '.xls': EXCEL,
  '.xlsx': EXCEL_OPEN_XML,
  '.odt': ['application/vnd.oasis.opendocument.text', UNKNOWN_BINARY],
  '.ods': ['application/vnd.oasis.opendocument.spreadsheet', UNKNOWN_BINARY],
  '.msg': ['application/vnd.ms-outlook', UNKNOWN_BINARY],
};

/** Whether both the file's extension and the MIME type the browser sent for it are on the list, and agree. */
const isAllowedMessageAttachment = (file: UploadedFileLike): boolean => {
  const allowedMimeTypes = MESSAGE_ATTACHMENT_TYPES[extname(file.originalname).toLowerCase()];
  return allowedMimeTypes?.includes(file.mimetype.toLowerCase()) ?? false;
};

/**
 * Refuses a message whose attachments include a file type the sökande should not be sent (400). The refusal does not
 * name the file: a file name may carry personal data, and the refusal is logged.
 *
 * @param files The files uploaded with the message
 */
export const assertAllowedMessageAttachments = (files: UploadedFileLike[]): void => {
  if (!files.every(isAllowedMessageAttachment)) {
    throw new HttpException(
      400,
      'En av filerna har en filtyp som inte kan skickas. Tillåtna är PDF, bilder, Word, Excel, OpenDocument, RTF, text och Outlook-meddelanden.',
    );
  }
};
