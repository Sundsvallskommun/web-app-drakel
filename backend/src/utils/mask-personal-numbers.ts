/**
 * A personnummer or samordningsnummer: 10–12 digits, optionally with `-` or `+` before the last four (YYMMDD-NNNN,
 * YYYYMMDDNNNN …), not part of a longer run of digits.
 */
const PERSONAL_NUMBER = /(?<!\d)\d{6,8}[-+]?\d{4}(?!\d)/g;

/**
 * Masks everything in a text that could be a personnummer, before the text is logged. An error's message may carry
 * one — careM's problem details quote the handläggare's data back ("… no personnummer for 19800101-1234") — and the
 * logs must not.
 *
 * @param text A message about to be logged
 */
export const maskPersonalNumbers = (text: string): string => text.replace(PERSONAL_NUMBER, '[personnummer]');
