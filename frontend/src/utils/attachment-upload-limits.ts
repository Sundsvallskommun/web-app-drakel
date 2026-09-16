/** Per-file upload ceiling in MB; mirrors the backend MAX_UPLOAD_FILE_SIZE_BYTES (20 MB). */
export const MAX_ATTACHMENT_FILE_SIZE_MB = 20;

/**
 * Human-readable file extensions accepted by sk-web-gui's FileUpload (its default accepted mime types),
 * shown to the handläggare next to upload controls.
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
  '.html',
  '.xls',
  '.xlsx',
  '.odt',
  '.ods',
  '.msg',
];
