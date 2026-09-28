import { createHash, timingSafeEqual } from 'crypto';

const sha256 = (value: string): Buffer => createHash('sha256').update(value, 'utf8').digest();

/**
 * Compares two secrets (e.g. an Authorization header against the expected credentials) in constant time.
 * Both sides are hashed first, so timingSafeEqual always gets buffers of equal length and neither the content
 * nor the length of the expected value leaks through how long the comparison takes. Server-side only.
 */
export const constantTimeEquals = (actual: string, expected: string): boolean =>
  timingSafeEqual(sha256(actual), sha256(expected));
