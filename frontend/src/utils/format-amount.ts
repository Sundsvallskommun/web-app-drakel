/** Formats a number as a Lifecare-style amount string ("23640,00"): two decimals, comma separator. */
export const formatAmount = (value: number): string => value.toFixed(2).replace('.', ',');
