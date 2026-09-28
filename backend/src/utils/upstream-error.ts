import axios from 'axios';

import { HttpException } from '@/exceptions/HttpException';
import { logger } from '@/utils/logger';

/** caremanagement and Templating answer with a Spring problem detail; `detail` is the sentence written for a human. */
interface ProblemDetail {
  detail?: string;
}

/** axios's codes for a call that ran out of time (ETIMEDOUT with transitional.clarifyTimeoutError). */
const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT']);

/**
 * The problem's `detail`. A binary read (e.g. a PDF, read as an ArrayBuffer) gets its error body as bytes too,
 * so those are decoded before the detail can be read.
 */
const detailOf = (body: unknown): string | undefined => {
  if (body instanceof ArrayBuffer || Buffer.isBuffer(body)) {
    try {
      const decoded = Buffer.from(body as ArrayBuffer).toString('utf-8');
      return (JSON.parse(decoded) as ProblemDetail).detail;
    } catch {
      return undefined;
    }
  }
  return (body as ProblemDetail | undefined)?.detail;
};

/** What identifies a failure without its content: axios's error code, or the error's class for anything else. */
const failureCodeOf = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.code ?? 'none';
  }
  return error instanceof Error ? error.name : typeof error;
};

/**
 * Logs an upstream call drakel could not pass on as it stands — by status and error code only. The body, the URL and
 * the message may all carry personal data (a partyId in the path, a personnummer in a problem detail), so none of them
 * is logged.
 *
 * @param upstream The API that was called, as it should read in the log
 * @param error What the call threw
 */
export const logUpstreamFailure = (upstream: string, error: unknown): void => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  logger.error(`${upstream} call failed (status ${status ?? 'none'}, code ${failureCodeOf(error)})`);
};

/**
 * Builds the mapper from a failed call to one upstream API onto the HttpException drakel returns to the frontend. The
 * upstream's name goes into the messages drakel writes itself, so a Templating failure does not read as caremanagement's.
 *
 * The statuses that mean something to the handläggare are carried through with the upstream's own `detail` — see
 * caremanagementError for why each is. A call that ran out of time is a 504. Anything else becomes a 500 and is logged
 * (status and code only), so a 401, a network failure or an unexpected status is never silent.
 *
 * @param upstream The API's name as the messages and the log should give it, e.g. `caremanagement`
 */
export const upstreamErrorMapper =
  (upstream: string) =>
  (error: unknown): HttpException => {
    if (axios.isAxiosError(error)) {
      if (error.code !== undefined && TIMEOUT_CODES.has(error.code)) {
        logUpstreamFailure(upstream, error);
        return new HttpException(504, `${upstream} did not answer in time`);
      }
      const detail = detailOf(error.response?.data);
      switch (error.response?.status) {
        case 400:
          return new HttpException(400, detail ?? `Bad request from ${upstream}`);
        case 403:
          return new HttpException(403, detail ?? `${upstream} is not allowed to do this`);
        case 404:
          return new HttpException(404, detail ?? 'Not found');
        case 409:
          return new HttpException(409, detail ?? 'The errand is not in a state that allows this');
        case 413:
          return new HttpException(413, 'Uploaded file is too large');
        case 422:
          return new HttpException(422, detail ?? `${upstream} could not do this for the errand`);
        case 502:
          return new HttpException(502, detail ?? `A system behind ${upstream} refused the request`);
        case 503:
          return new HttpException(503, detail ?? `A system behind ${upstream} is not available`);
        default:
          break;
      }
    }
    logUpstreamFailure(upstream, error);
    return new HttpException(500, `Internal server error from ${upstream}`);
  };
