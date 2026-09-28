import { httpStatusOf } from '@utils/http-error-status';
import { ValidationError } from 'class-validator';

const BAD_REQUEST = 400;
const PAYLOAD_TOO_LARGE = 413;
const INTERNAL_SERVER_ERROR = 500;

/** What the client is told when something failed that drakel did not expect — the details stay in the log. */
export const UNEXPECTED_ERROR_MESSAGE = 'Något gick fel. Försök igen, och kontakta support om felet kvarstår.';

/** The fields drakel reads off an error of any origin: its own, routing-controllers', multer's or a body parser's. */
interface ErrorFields {
  name?: string;
  message?: string;
  details?: Record<string, string>;
  code?: string;
  status?: number;
  expose?: boolean;
  errors?: ValidationError[];
}

/** How the error middleware answers a failed request, and whether the failure was one drakel meant to answer. */
interface ErrorResponse {
  status: number;
  message: string;
  /** False for a failure nobody raised on purpose (a TypeError, say): it is logged in full, never shown. */
  expected: boolean;
  /** An HttpException's details for the client, e.g. which document failed; never logged. */
  details?: Record<string, string>;
}

const fieldsOf = (error: unknown): ErrorFields => (typeof error === 'object' && error !== null ? error : {});

/** multer's refusals: a file over the size limit is a 413, any other limit or malformed upload a 400. */
const multerStatus = (error: ErrorFields): number | undefined => {
  if (error.name !== 'MulterError') {
    return undefined;
  }
  return error.code === 'LIMIT_FILE_SIZE' || error.message === 'File too large' ? PAYLOAD_TOO_LARGE : BAD_REQUEST;
};

/**
 * The status an error was raised with on purpose: drakel's HttpException and every routing-controllers HttpError
 * (BadRequestError, ParamRequiredError, a failed DTO validation …) carry `httpCode`; multer's errors are mapped; a
 * body parser's (http-errors) carry `status` and say, with `expose`, that their message is safe to show.
 */
const deliberateStatusOf = (error: unknown): number | undefined => {
  const fields = fieldsOf(error);
  return httpStatusOf(error) ?? multerStatus(fields) ?? (fields.expose === true ? fields.status : undefined);
};

/**
 * The answer to a failed request. An error raised on purpose keeps its status and message — careM's own sentence on a
 * 4xx or a 502 is what the handläggare acts on. Anything else is a 500 with a generic message, so no internal detail
 * (a stack, a file path, an upstream URL) reaches the browser.
 *
 * @param error Whatever the request failed with
 */
export const toErrorResponse = (error: unknown): ErrorResponse => {
  const status = deliberateStatusOf(error);
  if (status === undefined) {
    return { status: INTERNAL_SERVER_ERROR, message: UNEXPECTED_ERROR_MESSAGE, expected: false };
  }
  const { message, details } = fieldsOf(error);
  return {
    status,
    message: message !== undefined && message !== '' ? message : 'Something went wrong',
    expected: true,
    details,
  };
};

/** The validation errors a failed DTO validation carries, as `property: constraints` for the log. */
export const validationDetailsOf = (error: unknown): string => {
  const errors = fieldsOf(error).errors ?? [];
  return errors.length > 0
    ? JSON.stringify(errors.map(validationError => ({ property: validationError.property, constraints: validationError.constraints })))
    : '';
};
