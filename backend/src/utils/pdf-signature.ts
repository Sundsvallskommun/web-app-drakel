// Every PDF starts with these bytes; anything else is an error page or a login form.
const PDF_SIGNATURE = '%PDF';

/** Whether the bytes are a PDF — Lifecare answers a print it cannot make with an HTML page instead. */
export const isPdf = (bytes: Buffer): boolean => bytes.subarray(0, PDF_SIGNATURE.length).toString('latin1') === PDF_SIGNATURE;
