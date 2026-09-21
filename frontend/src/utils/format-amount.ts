/** Formats a number as a Lifecare-style amount string ("23640,00"): two decimals, comma separator. */
export const formatAmount = (value: number): string => value.toFixed(2).replace('.', ',');

/** An optional amount for display: the formatted value, or an em dash when there is none. */
export const displayAmount = (value?: number): string => (value == null ? '—' : formatAmount(value));
