/** Per-file upload ceiling in MB; mirrors the backend MAX_UPLOAD_FILE_SIZE_BYTES (20 MB). */
export const MAX_ATTACHMENT_FILE_SIZE_MB = 20;

/**
 * Human-readable file extensions a message attachment may have, shown to the handläggare next to upload controls.
 * sk-web-gui FileUpload's defaults less HTML, which the backend refuses: an HTML file can carry script.
 */
export const ALLOWED_ATTACHMENT_FILE_EXTENSIONS = [
  '.jpeg',
  '.gif',
  '.png',
  '.tiff',
  '.bmp',
  '.pdf',
  '.rtf',
  '.doc',
  '.docx',
  '.txt',
  '.xls',
  '.xlsx',
  '.odt',
  '.ods',
  '.msg',
];

/** What a browser sends for a file whose type its system does not know — common for office files and Outlook's .msg. */
const UNKNOWN_BINARY = 'application/octet-stream';

/** The MIME types a message attachment may have — the backend's list (message-attachment-types), which has no HTML. */
const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/gif',
  'image/png',
  'image/tiff',
  'image/bmp',
  'image/x-ms-bmp',
  'text/plain',
  'application/rtf',
  'text/rtf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.ms-outlook',
  UNKNOWN_BINARY,
];

/**
 * FileUpload's `accept` for message attachments, in place of its defaults (which include HTML). FileUpload checks a
 * picked file's MIME type against the list and also hands it to the file picker, where the extensions let it offer
 * the files by name.
 */
export const MESSAGE_ATTACHMENT_ACCEPT = [...ALLOWED_ATTACHMENT_MIME_TYPES, ...ALLOWED_ATTACHMENT_FILE_EXTENSIONS];
