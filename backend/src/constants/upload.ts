/**
 * Per-file upload ceiling shared by every upload route (errand attachments and message attachments).
 * caremanagement rejects larger uploads with 413; multer enforces the same limit up-front so an
 * oversized file never reaches the network. Single source of truth for the size limit.
 */
const MAX_UPLOAD_FILE_SIZE_BYTES = 20 * 1024 * 1024;

/** The text fields a multipart route may carry beside its files (a message's body and reply target, finalize's request). */
const MAX_MULTIPART_FIELDS = 5;

/**
 * The largest text field of a multipart request. The largest real one is a message of 8192 characters, or finalize's
 * request carrying such a message, so this leaves room for multi-byte characters and JSON without accepting megabytes.
 */
const MAX_MULTIPART_FIELD_BYTES = 64 * 1024;

/**
 * The options of an optional `@UploadedFiles` parameter: multer's limits on the files and on everything else in the
 * request — the text fields, their size and the number of parts — so a request cannot make multer buffer more than
 * the route will ever use. A request over a limit is refused (400, 413 for a file too large) before the handler runs.
 *
 * @param maxFiles The most files the route takes
 */
export const multipartUploadOptions = (maxFiles: number) => ({
  required: false,
  options: {
    limits: {
      files: maxFiles,
      fileSize: MAX_UPLOAD_FILE_SIZE_BYTES,
      fields: MAX_MULTIPART_FIELDS,
      fieldSize: MAX_MULTIPART_FIELD_BYTES,
      parts: maxFiles + MAX_MULTIPART_FIELDS,
    },
  },
});
