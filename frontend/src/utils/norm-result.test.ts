import { describe, expect, it } from 'vitest';

import { computeNormResult, fromLifecareSummary, isSurplus } from './norm-result';

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

describe('fromLifecareSummary', () => {
  it('takes Lifecare’s own count of a saved beräkning, with its breakdown', () => {
    const result = fromLifecareSummary({
      income: 9500,
      jobStimulus: 5000,
      jobStimulusDeduction: 1250,
      norm: 3393,
      familyCost: 3393,
      commonHouseholdCost: 0,
      expenses: 5153,
      sum: 954,
      specialExpenses: 0,
      result: 954,
    });

    expect(result).toMatchObject({ income: 9500, norm: 3393, sum: 954, result: 954 });
    expect(result.details).toEqual({
      jobStimulus: 5000,
      jobStimulusDeduction: 1250,
      familyCost: 3393,
      commonHouseholdCost: 0,
    });
    expect(isSurplus(result)).toBe(true);
  });
});
