import { HttpException } from '@exceptions/HttpException';
import { RequestWithUser } from '@interfaces/auth.interface';
import { Permissions } from '@interfaces/users.interface';
import { NextFunction, Response } from 'express';

/**
 * Guards a route on one of the session user's permissions. Used after `authMiddleware`, which has already
 * established that there is a user — a signed-in user lacking the permission is a 403 rather than a 401,
 * so the frontend can tell "log in again" apart from "not for you".
 *
 * @param permission The permission the route requires
 */
export const requirePermission = (permission: keyof Permissions) => (req: RequestWithUser, _res: Response, next: NextFunction) => {
  if (req.user?.permissions?.[permission]) {
    next();
    return;
  }
  next(new HttpException(403, 'FORBIDDEN'));
};
