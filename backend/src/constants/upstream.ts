/**
 * How long drakel waits for an upstream API before giving up with a 504. Without it a hung connection would hold the
 * handläggare's request — and a socket — open indefinitely.
 */
export const UPSTREAM_TIMEOUT_MS = 30_000;

/**
 * How long a file transfer may take: a PDF Lifecare prints through careM, a PDF Templating renders, or a multipart upload
 * carrying several attachments. These are slower than an ordinary read, so they get longer before they count as hung.
 */
export const UPSTREAM_FILE_TIMEOUT_MS = 120_000;

/**
 * The largest upstream response drakel reads into memory. Well above any attachment (uploads are capped at 20 MB) or
 * Lifecare print, so it only stops a runaway response.
 */
export const MAX_UPSTREAM_RESPONSE_BYTES = 64 * 1024 * 1024;

/**
 * The largest request body drakel sends upstream. A beslut goes out with up to ten attachments of 20 MB plus Lifecare's
 * documents, as multipart to careM or base64 in a letter to Messaging, so the ceiling is generous.
 */
export const MAX_UPSTREAM_REQUEST_BYTES = 256 * 1024 * 1024;
