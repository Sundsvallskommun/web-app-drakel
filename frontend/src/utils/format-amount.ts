/** Formats a number as a Lifecare-style amount string ("23640,00"): two decimals, comma separator. */
export const formatAmount = (value: number): string => value.toFixed(2).replace('.', ',');

/** An optional amount for display: the formatted value, or an em dash when there is none. */
export const displayAmount = (value?: number): string => (value == null ? '—' : formatAmount(value));

/** An optional amount in kronor for display, "6200,00 kr" — or an em dash when there is none. */
export const formatKronor = (value?: number): string => (value == null ? '—' : `${formatAmount(value)} kr`);

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

/** Whether an amount field holds an amount — or nothing, which means "no amount". */
export const isAmountText = (text: string): boolean => text.trim() === '' || parseAmount(text) !== undefined;

/** A saved amount as an amount field's text ("1234,50"), or empty when there is none. */
export const toAmountInput = (value?: number): string => (value == null ? '' : formatAmount(value));

/**
 * Whether an amount field stands for another amount than the saved one. Compared as numbers, so "1234,50" and
 * "1 234,5" are the same amount as a saved 1234.5 — a text comparison would call the row changed forever.
 */
export const isAmountChanged = (text: string, saved?: number): boolean => parseAmount(text) !== saved;

/**
 * Whether an amount is below zero counted in whole öre — so a saldo careM works out as −0,0000001 (shown 0,00 kr) is
 * not flagged as overdrawn.
 */
export const isBelowZero = (amount: number): boolean => Math.round(amount * 100) < 0;
