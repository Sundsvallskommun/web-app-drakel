import { PDF_MIME_TYPE } from './pdf-object-url';

/**
 * The image types shown inline: raster formats only. An SVG is a document that can carry script, and an object
 * URL for it lives in our own origin — opened in a tab of its own it would run there.
 */
const RASTER_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);

/** Only the modern .docx (Office Open XML) can be rendered client-side; legacy binary .doc cannot. */
const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const isRasterImageMimeType = (mimeType: string): boolean => RASTER_IMAGE_MIME_TYPES.has(mimeType.toLowerCase());

const isPdfMimeType = (mimeType: string): boolean => mimeType.toLowerCase() === PDF_MIME_TYPE;

export const isDocxMimeType = (mimeType: string): boolean => mimeType.toLowerCase() === DOCX_MIME_TYPE;

/** Mime types we can render inline (PDF in an iframe, raster images fitted, .docx rendered client-side). */
export const isPreviewableMimeType = (mimeType: string): boolean =>
  isPdfMimeType(mimeType) || isRasterImageMimeType(mimeType) || isDocxMimeType(mimeType);
