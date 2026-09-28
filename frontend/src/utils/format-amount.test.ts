import { describe, expect, it } from 'vitest';

import {
  displayAmount,
  formatAmount,
  formatKronor,
  isAmountChanged,
  isAmountText,
  isBelowZero,
  parseAmount,
  toAmountInput,
} from './format-amount';

describe('formatAmount', () => {
  it('writes two decimals with a decimal comma', () => {
    expect(formatAmount(1234.5)).toBe('1234,50');
  });
});

describe('displayAmount / formatKronor', () => {
  it('shows an em dash when there is no amount', () => {
    expect(displayAmount(undefined)).toBe('—');
    expect(formatKronor(undefined)).toBe('—');
  });

  it('adds the currency for kronor', () => {
    expect(formatKronor(6200)).toBe('6200,00 kr');
  });
});

describe('parseAmount', () => {
  it('reads a decimal comma or point', () => {
    expect(parseAmount('1234,50')).toBe(1234.5);
    expect(parseAmount('1234.50')).toBe(1234.5);
  });

  it('ignores the spaces of a grouped amount', () => {
    expect(parseAmount('12 500')).toBe(12500);
    expect(parseAmount(' 12 500,25 ')).toBe(12500.25);
  });

  it('is undefined for an empty or unreadable field', () => {
    expect(parseAmount('')).toBeUndefined();
    expect(parseAmount('   ')).toBeUndefined();
    expect(parseAmount('12,5,0')).toBeUndefined();
    expect(parseAmount('abc')).toBeUndefined();
  });
});

describe('amount fields', () => {
  it('starts a field from the saved amount in the same format it is shown in', () => {
    expect(toAmountInput(1234.5)).toBe('1234,50');
    expect(toAmountInput(undefined)).toBe('');
  });

  it('compares a field with the saved amount as numbers', () => {
    expect(isAmountChanged('1234,50', 1234.5)).toBe(false);
    expect(isAmountChanged('1 234,5', 1234.5)).toBe(false);
    expect(isAmountChanged('', undefined)).toBe(false);
    expect(isAmountChanged('1234,60', 1234.5)).toBe(true);
    expect(isAmountChanged('', 1234.5)).toBe(true);
  });

  it('accepts an empty field or an amount, nothing else', () => {
    expect(isAmountText('')).toBe(true);
    expect(isAmountText('12 500,00')).toBe(true);
    expect(isAmountText('tolv')).toBe(false);
  });
});

describe('isBelowZero', () => {
  it('flags an overdrawn saldo', () => {
    expect(isBelowZero(-0.01)).toBe(true);
    expect(isBelowZero(-250)).toBe(true);
  });

  it('does not flag a saldo that is 0,00 kr in whole öre, however careM rounded it', () => {
    expect(isBelowZero(0)).toBe(false);
    expect(isBelowZero(-0.0000001)).toBe(false);
    expect(isBelowZero(-0.004)).toBe(false);
  });
});
