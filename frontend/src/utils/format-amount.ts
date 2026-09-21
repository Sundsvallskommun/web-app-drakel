/** Formats a number as a Lifecare-style amount string ("23640,00"): two decimals, comma separator. */
export const formatAmount = (value: number): string => value.toFixed(2).replace('.', ',');

/** An optional amount for display: the formatted value, or an em dash when there is none. */
export const displayAmount = (value?: number): string => (value == null ? '—' : formatAmount(value));

/**
 * Parses a Lifecare-style amount string ("8450,00" or "8450.00") back to a number. Returns undefined
 * for anything that isn't a number, so an empty or half-typed field is sent as "no amount" rather than
 * as NaN.
 */
export const parseAmount = (value: string): number | undefined => {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  if (normalized === '') {
    return undefined;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};
