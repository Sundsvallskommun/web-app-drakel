export const PDF_MIME_TYPE = 'application/pdf';

/**
 * Creates an object URL for fetched bytes as the type the app has decided to show them as. The Content-Type the
 * server (and, behind it, whoever uploaded the file) put on the response is never trusted: a "PDF" that came
 * back as text/html would otherwise render as a page in our own origin inside the preview iframe.
 */
export const objectUrlAs = (blob: Blob, type: string): string => window.URL.createObjectURL(new Blob([blob], { type }));

/** An object URL for bytes shown as a PDF, whatever type they were served with. */
export const pdfObjectUrl = (blob: Blob): string => objectUrlAs(blob, PDF_MIME_TYPE);

/** The bytes of a base64 PDF. */
export const base64PdfToBlob = (base64: string): Blob =>
  new Blob([Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))], { type: PDF_MIME_TYPE });

/** Converts a base64 PDF to an object URL, to show in an <iframe> or open in a tab of its own. */
export const base64PdfToObjectUrl = (base64: string): string => pdfObjectUrl(base64PdfToBlob(base64));
