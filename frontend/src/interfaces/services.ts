export interface ServiceResponse<T = unknown> {
  data?: T;
  error?: number | string | boolean;
  message?: string;
  /** Facts beside the BFF's error message, e.g. `lifecareDocumentId` for the Lifecare document that failed. */
  details?: Record<string, string>;
}
