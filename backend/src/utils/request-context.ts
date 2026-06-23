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
