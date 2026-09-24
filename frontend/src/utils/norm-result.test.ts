import { describe, expect, it } from 'vitest';

import { computeNormResult, isSurplus } from './norm-result';

describe('computeNormResult', () => {
  it('counts the way Lifecare’s Summering does', () => {
    // The Summering in Lifecare: inkomster 9 500, norm 3 393, utgifter 5 153 → summa 954, resultat 954.
    const result = computeNormResult({ incomeSum: 9500, normSum: 3393, expenseSum: 5153, specialExpenseSum: 0 });

    expect(result).toEqual({ income: 9500, norm: 3393, expenses: 5153, sum: 954, specialExpenses: 0, result: 954 });
    expect(result && isSurplus(result)).toBe(true);
  });

  it('takes the levnadskostnader i övrigt off the summa, into an underskott', () => {
    const result = computeNormResult({ incomeSum: 0, normSum: 5220, expenseSum: 454, specialExpenseSum: 300 });

    expect(result?.sum).toBe(-5674);
    expect(result?.result).toBe(-5974);
    expect(result && isSurplus(result)).toBe(false);
  });

  it('has no result without a norm', () => {
    expect(computeNormResult({ incomeSum: 100 })).toBeUndefined();
  });
});
