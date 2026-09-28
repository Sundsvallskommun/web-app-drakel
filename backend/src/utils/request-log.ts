import { Request } from 'express';
import morgan from 'morgan';

/**
 * A request URL without its query string. The query is left out of the request log because it carries what the
 * handläggare searched for — the overview filters on the sökande's name — and that must not end up in the logs.
 *
 * @param url The URL as the request line gave it, e.g. `/api/errands?filter=…`
 */
export const pathWithoutQuery = (url: string): string => {
  const queryStart = url.indexOf('?');
  return queryStart === -1 ? url : url.slice(0, queryStart);
};

/**
 * The HTTP request logger. morgan's `:url` token, which every format (dev, combined …) prints, is redefined as the
 * path alone, so method, status and timing are logged as before but never the query string.
 *
 * @param format The morgan format, LOG_FORMAT
 * @param stream Where the lines go — the application logger
 */
export const requestLogger = (format: string, stream: morgan.StreamOptions) => {
  morgan.token('url', (req: Request) => pathWithoutQuery(req.originalUrl || req.url));
  return morgan(format, { stream });
};
