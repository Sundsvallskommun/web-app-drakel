/** A file read from an upstream API, e.g. an attachment caremanagement answers raw, with what its headers say about it. */
export interface AttachmentFile {
  data: Buffer;
  contentType?: string;
  fileName?: string;
}

/** Minimal shape of a multer-uploaded file (avoids depending on @types/multer). */
export interface UploadedFileLike {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}
