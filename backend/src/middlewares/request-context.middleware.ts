import { User } from '@interfaces/users.interface';
import { runWithRequestContext } from '@utils/request-context';
import { NextFunction, Request, Response } from 'express';

/**
 * Captures the authenticated user into request-scoped storage so deeper layers (the caremanagement
 * transport) can stamp the X-Sent-By header — letting caremanagement attribute its event log to the
 * acting handläggare — without every controller passing the username down.
 */
const requestContextMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const username = (req.user as Partial<User> | undefined)?.username;
  runWithRequestContext({ username }, () => {
    next();
  });
};

export default requestContextMiddleware;
