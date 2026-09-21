import { ORIGIN } from '@/config';

/**
 * The configured origins, split and trimmed so that `a,b` and `a, b` behave the same. An origin is
 * scheme + host + port and never carries a path — a value like `http://10.0.0.1/idp` can never match
 * the `Origin` header a browser sends.
 */
export const allowedOrigins = (): string[] =>
  ORIGIN.split(',')
    .map(origin => origin.trim())
    .filter(origin => origin !== '');

export const isValidOrigin = (url: string): boolean => {
  const origin = new URL(url).origin;
  return allowedOrigins().includes(origin);
};
