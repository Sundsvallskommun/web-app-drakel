import { requestContextOf, runWithRequestContext } from '@utils/request-context';
import { NextFunction, Request, Response } from 'express';

/**
 * Captures the authenticated user into request-scoped storage so deeper layers (the caremanagement
 * transport) can stamp the X-Sent-By header — letting caremanagement attribute its event log to the
 * acting handläggare — without every controller passing the username down. A multipart route loses it
 * (see withRequestContext) and restores it itself.
 */
const requestContextMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  runWithRequestContext(requestContextOf(req), () => {
    next();
  });
};

export default requestContextMiddleware;
