import { HttpError } from 'routing-controllers';

/**
 * The HTTP status a failed call was rejected with, e.g. a caremanagement 404 mapped by `caremanagementError`.
 *
 * Checks for routing-controllers' `HttpError`, not drakel's `HttpException`: HttpError's constructor resets the
 * prototype to its own, so `error instanceof HttpException` is false even for an HttpException.
 */
export const httpStatusOf = (error: unknown): number | undefined => (error instanceof HttpError ? error.httpCode : undefined);
