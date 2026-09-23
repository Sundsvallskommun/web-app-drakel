import { HttpException } from '@exceptions/HttpException';
import axios, { AxiosResponse } from 'axios';

/**
 * Maps a Lifecare response that is not a success onto the HttpException drakel returns to its own
 * frontend.
 *
 * Lifecare's api2 endpoints carry no problem detail worth forwarding — a failure is a status and an
 * empty body — so unlike the caremanagement mapper this one has no upstream sentence to pass on.
 * Anything unrecognised becomes a 502 rather than a 500: the call drakel itself received was fine,
 * it is the system behind it that would not answer.
 */
export const lifecareError = (response: AxiosResponse): HttpException => {
  switch (response.status) {
    case 400:
      return new HttpException(400, 'Bad request to Lifecare');
    case 403:
      // Not a session problem — Lifecare is saying this account may not read this.
      return new HttpException(403, 'The Lifecare account is not allowed to read this');
    case 404:
      return new HttpException(404, 'Not found');
    default:
      return new HttpException(502, `Lifecare answered ${response.status}`);
  }
};

/**
 * Maps a call that never reached Lifecare at all — DNS, TLS, a timeout, a socket closed mid-flight.
 *
 * The axios code is carried into the message because it is the whole diagnosis (`ECONNREFUSED` says
 * something very different from `ETIMEDOUT`), and it holds nothing about the person being looked up.
 */
export const lifecareUnreachable = (error: unknown): HttpException => {
  const code = axios.isAxiosError(error) ? error.code : undefined;
  return new HttpException(502, code ? `Lifecare could not be reached (${code})` : 'Lifecare could not be reached');
};
