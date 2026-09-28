import { validateInput } from '@utils/validate-input';
import { ClassConstructor } from 'class-transformer';
import { RequestHandler } from 'express';

export const validationMiddleware = (
  type: ClassConstructor<object>,
  value: 'body' | 'query' | 'params' = 'body',
  skipMissingProperties = false,
  whitelist = true,
  forbidNonWhitelisted = true,
): RequestHandler => {
  return (req, _res, next) => {
    validateInput(type, req[value], { skipMissingProperties, whitelist, forbidNonWhitelisted }).then(
      () => {
        next();
      },
      (error: unknown) => {
        next(error);
      },
    );
  };
};
