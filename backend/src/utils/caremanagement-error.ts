import axios from 'axios';

import { HttpException } from '@/exceptions/HttpException';

/** caremanagement answers with a Spring problem detail; `detail` is the sentence written for a human. */
interface ProblemDetail {
  detail?: string;
}

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
 * A 409 is carried through the same way: it means the errand is not in a state that allows the action
 * (finalize answers it for "wrong status, sections not approved or already finalized"), and the detail
 * says which of those it was.
 */
export const caremanagementError = (error: unknown): HttpException => {
  if (axios.isAxiosError<ProblemDetail>(error)) {
    switch (error.response?.status) {
      case 400:
        return new HttpException(400, 'Bad request from caremanagement');
      case 404:
        return new HttpException(404, 'Not found');
      case 409:
        return new HttpException(409, error.response.data?.detail ?? 'The errand is not in a state that allows this');
      case 413:
        return new HttpException(413, 'Uploaded file is too large');
      case 502:
        return new HttpException(502, error.response.data?.detail ?? 'A system behind caremanagement refused the request');
      default:
        break;
    }
  }
  return new HttpException(500, 'Internal server error from caremanagement');
};
