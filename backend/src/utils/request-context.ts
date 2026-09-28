import { AsyncLocalStorage } from 'node:async_hooks';

import { User } from '@interfaces/users.interface';
import { Request } from 'express';

/**
 * Per-request data made available to deeper layers (e.g. the caremanagement transport) without
 * threading it through every controller and service call. Populated by the request-context middleware.
 */
export interface RequestContext {
  username?: string;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Runs `callback` with the given request context active for the rest of the request. */
export const runWithRequestContext = <T>(context: RequestContext, callback: () => T): T => storage.run(context, callback);

/** The request context of an Express request: the signed-in user's username, when there is one. */
export const requestContextOf = (req: Request): RequestContext => ({ username: (req.user as Partial<User> | undefined)?.username });

/**
 * Runs a handler's work with the request's context active again.
 *
 * The context set by the global middleware does not survive a multipart route: routing-controllers runs multer per
 * route, after that middleware, and multer calls `next()` from a busboy stream event — outside the async context the
 * middleware opened. Every handler behind `@UploadedFile(s)` therefore wraps its body in this, or caremanagement would
 * log its writes without the acting handläggare (no X-Sent-By).
 *
 * @param req The request, whose user the context is read from
 * @param work The handler's body
 */
export const withRequestContext = <T>(req: Request, work: () => T): T => runWithRequestContext(requestContextOf(req), work);

/** The authenticated username for the current request, if any. */
const getRequestUsername = (): string | undefined => storage.getStore()?.username;

/**
 * The X-Sent-By header that attributes a caremanagement request to the acting handläggare (adAccount),
 * feeding caremanagement's per-errand event log. Empty when the request has no authenticated user.
 */
export const sentByHeaders = (): Record<string, string> => {
  const username = getRequestUsername();
  return username ? { 'X-Sent-By': `${username}; type=adAccount` } : {};
};
