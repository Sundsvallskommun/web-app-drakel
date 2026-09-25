import axios from 'axios';

import { HttpException } from '@/exceptions/HttpException';

/** caremanagement answers with a Spring problem detail; `detail` is the sentence written for a human. */
interface ProblemDetail {
  detail?: string;
}

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

/**
 * Maps a failed caremanagement call onto the HttpException drakel returns to the frontend.
 *
 * Shared by every caremanagement service so the same upstream status always surfaces the same way
 * (e.g. a 413 on the attachment path and a 413 on the message path both reach the client as 413,
 * instead of one collapsing to a generic 500). Anything unrecognised becomes a 500.
 *
 * A 502 is carried through with caremanagement's own `detail`: it means a system behind caremanagement
 * (Lifecare) refused, and the sentence says which of the handläggare's data it could not work with —
 * "No personal identity number could be resolved for a person on the calculation", say. Replacing that
 * with a generic message would leave the handläggare with a failure and nothing to act on.
 *
 * A 400 and a 422 are carried through too: on the Lifecare routes caremanagement words its refusals for the
 * handläggare ("Spara beslutet innan du beslutar och betalar ut."). A 400 without a detail (e.g. a constraint
 * violation) falls back to a generic sentence.
 *
 * A 409 is carried through the same way: it means the errand is not in a state that allows the action
 * (finalize answers it for "wrong status, sections not approved or already finalized"), and the detail
 * says which of those it was.
 */
export const caremanagementError = (error: unknown): HttpException => {
  if (axios.isAxiosError(error)) {
    const detail = detailOf(error.response?.data);
    switch (error.response?.status) {
      case 400:
        return new HttpException(400, detail ?? 'Bad request from caremanagement');
      case 403:
        return new HttpException(403, detail ?? 'caremanagement is not allowed to do this');
      case 404:
        return new HttpException(404, 'Not found');
      case 409:
        return new HttpException(409, detail ?? 'The errand is not in a state that allows this');
      case 413:
        return new HttpException(413, 'Uploaded file is too large');
      case 422:
        return new HttpException(422, detail ?? 'caremanagement could not do this for the errand');
      case 502:
        return new HttpException(502, detail ?? 'A system behind caremanagement refused the request');
      case 503:
        return new HttpException(503, detail ?? 'A system behind caremanagement is not available');
      default:
        break;
    }
  }
  return new HttpException(500, 'Internal server error from caremanagement');
};
