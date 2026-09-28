import { extname } from 'node:path';

import { AttachmentFile } from '@interfaces/file.interface';
import { Response } from 'express';

import { attachmentDisposition } from '@/utils/content-disposition';

/**
 * Sends a file read from an upstream API to the browser as a download, under the name upstream gave it.
 *
 * The Content-Disposition is built by attachmentDisposition: a name with a quote, a `%` or a character outside Latin-1
 * (“–”) neither breaks the header nor makes Node refuse it with ERR_INVALID_CHAR, as a hand-built `filename="…"` did.
 * The content type is upstream's; without one it is guessed from the name's extension.
 *
 * @param response The Express response to send on
 * @param file The file, with the content type and name upstream gave it
 * @param fallbackName The name to use when upstream gave none, e.g. the attachment id
 */
export const sendAttachment = (response: Response, file: AttachmentFile, fallbackName: string): Response => {
  const fileName = file.fileName ?? fallbackName;
  response.setHeader('Content-Disposition', attachmentDisposition(fileName));
  if (file.contentType) {
    response.setHeader('Content-Type', file.contentType);
  } else {
    response.type(extname(fileName));
  }
  return response.send(file.data);
};
