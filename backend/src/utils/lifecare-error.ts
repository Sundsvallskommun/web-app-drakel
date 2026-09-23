import { HttpException } from '@exceptions/HttpException';
import axios, { AxiosResponse } from 'axios';

/**
 * The keys Lifecare puts its error sentence under. api2 uses `exceptionMessage` (seen on a refused
 * CreateJournalNote); the others are what ASP.NET Web API of its vintage uses elsewhere.
 */
const MESSAGE_KEYS = ['exceptionMessage', 'ExceptionMessage', 'message', 'Message'] as const;

/** Lifecare's own status for "I understood the request but will not do it" — a validation refusal. */
const LIFECARE_REFUSED_STATUS = 461;

/**
 * Lifecare's own sentence for a refusal, when its answer carries one.
 *
 * A handläggare whose write was refused has to see why in Lifecare's words — there is no copy of the
 * text anywhere else, so "something went wrong" would leave them nothing to act on.
 */
export const lifecareMessage = (body: unknown): string | undefined => {
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }
  const fields = body as Record<string, unknown>;
  const message = MESSAGE_KEYS.map(key => fields[key]).find((value): value is string => typeof value === 'string' && value.trim() !== '');
  return message?.trim();
};

/**
 * Maps a Lifecare response that is not a success onto the HttpException drakel returns to its own
 * frontend.
 *
 * Most of Lifecare's api2 failures are a status and an empty body; when one does carry a sentence it is
 * passed on. Anything unrecognised becomes a 502 rather than a 500: the call drakel itself received was
 * fine, it is the system behind it that would not answer.
 */
export const lifecareError = (response: AxiosResponse): HttpException => {
  const message = lifecareMessage(response.data);
  switch (response.status) {
    case 400:
      return new HttpException(400, message ?? 'Bad request to Lifecare');
    case 403:
      // Not a session problem — Lifecare is saying this account may not read this.
      return new HttpException(403, 'The Lifecare account is not allowed to read this');
    case 404:
      return new HttpException(404, 'Not found');
    case LIFECARE_REFUSED_STATUS:
      // The handläggare's input broke one of Lifecare's rules (e.g. a time in the future): theirs to fix,
      // so a 422 with Lifecare's sentence rather than a 502 that reads as an outage.
      return new HttpException(422, message ?? 'Lifecare godtog inte uppgifterna.');
    default:
      return new HttpException(502, message ?? `Lifecare answered ${response.status}`);
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
