/**
 * Safe readers for SSBTEK's agency answers, which careM forwards verbatim and does not model: every field can be
 * absent, a list with one item can come as the item itself (the answers are converted from XML), and a number
 * can come as a string. Each reader returns undefined, or an empty list, for anything not of its shape.
 */

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as JsonRecord) : undefined;

/** A list as a list, a lone item as a list of one, and nothing as an empty list. */
export const asList = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return value === undefined || value === null ? [] : [value];
};

/** The field at the path, e.g. `fieldAt(answer, 'formansinformation', 'utbetalningsuppgift')`. */
export const fieldAt = (value: unknown, ...path: string[]): unknown => path.reduce<unknown>((current, key) => asRecord(current)?.[key], value);

export const textOf = (value: unknown): string | undefined => {
  if (typeof value === 'string') {
    return value.trim() === '' ? undefined : value.trim();
  }
  return typeof value === 'number' ? String(value) : undefined;
};

export const numberOf = (value: unknown): number | undefined => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.trim().replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

/** A code's text: `{ kod | id, beskrivning }` gives the beskrivning, a plain string is itself. */
export const descriptionOf = (value: unknown): string | undefined =>
  textOf(fieldAt(value, 'beskrivning')) ?? textOf(fieldAt(value, 'namn')) ?? textOf(value);

/** An amount: `{ summa, valuta }` or a plain number. */
export const amountOf = (value: unknown): number | undefined => numberOf(fieldAt(value, 'summa')) ?? numberOf(value);

export interface SsbtekPeriod {
  from?: string;
  to?: string;
}

/** A period as the agencies write it: `{ fran, till }` (Försäkringskassan) or `{ from, tom }` (Pensionsmyndigheten). */
export const periodOf = (value: unknown): SsbtekPeriod => ({
  from: textOf(fieldAt(value, 'fran')) ?? textOf(fieldAt(value, 'from')),
  to: textOf(fieldAt(value, 'till')) ?? textOf(fieldAt(value, 'tom')),
});

/** An extent as a fraction, `{ taljare, namnare }`, written as a percentage ("50 %"). */
export const extentOf = (value: unknown): string | undefined => {
  const numerator = numberOf(fieldAt(value, 'taljare'));
  const denominator = numberOf(fieldAt(value, 'namnare'));
  if (numerator === undefined || denominator === undefined || denominator === 0) {
    return undefined;
  }
  return `${String(Math.round((numerator / denominator) * 100))} %`;
};
