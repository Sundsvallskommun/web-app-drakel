import { toErrorResponse, validationDetailsOf } from '@utils/error-response';
import { logger } from '@utils/logger';
import { maskPersonalNumbers } from '@utils/mask-personal-numbers';
import { NextFunction, Request, Response } from 'express';

/** What a log line may carry of user-controlled or upstream text: no line breaks (log forging), no personnummer. */
const safeForLog = (input: string): string => maskPersonalNumbers(input.replace(/[\r\n]/g, ''));

/** The whole of an unexpected error for the log — its stack when it has one. */
const describeUnexpected = (error: unknown): string => (error instanceof Error ? (error.stack ?? `${error.name}: ${error.message}`) : String(error));

/**
 * The last middleware: answers a failed request with `{ message }` and the error's status (see toErrorResponse), and
 * logs it once — the logger writes to the console as well as the files. A failure drakel did not expect is logged
 * with its stack, but the browser only gets a generic message.
 */
const errorMiddleware = (error: unknown, req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, message, expected, details } = toErrorResponse(error);
    const detail = expected ? `Message:: ${message}, Errors:: ${validationDetailsOf(error)}` : `Unexpected:: ${describeUnexpected(error)}`;
    const logLine = safeForLog(`[${req.method}] ${req.path} >> StatusCode:: ${status}, ${detail}`);
    if (status >= 500) {
      logger.error(logLine);
    } else {
      logger.warn(logLine);
    }
    // The details go to the client only: the log line above carries the message alone.
    res.status(status).json(details ? { message, details } : { message });
  } catch (middlewareError) {
    next(middlewareError);
  }
};

export default errorMiddleware;
