/**
 * Per-file upload ceiling shared by every upload route (errand attachments and message attachments).
 * caremanagement rejects larger uploads with 413; multer enforces the same limit up-front so an
 * oversized file never reaches the network. Single source of truth for the size limit.
 */
export const MAX_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024;
