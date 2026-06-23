import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Per-request data made available to deeper layers (e.g. the caremanagement transport) without
 * threading it through every controller and service call. Populated by the request-context middleware.
 */
export interface RequestContext {
  username?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Runs `callback` with the given request context active for the rest of the request. */
export const runWithRequestContext = <T>(context: RequestContext, callback: () => T): T =>
  storage.run(context, callback);

/** The authenticated username for the current request, if any. */
export const getRequestUsername = (): string | undefined => storage.getStore()?.username;

/**
 * The X-Sent-By header that attributes a caremanagement request to the acting handläggare (adAccount),
 * feeding caremanagement's per-errand event log. Empty when the request has no authenticated user.
 */
export const sentByHeaders = (): Record<string, string> => {
  const username = getRequestUsername();
  return username ? { 'X-Sent-By': `${username}; type=adAccount` } : {};
};
