import { describe, expect, it } from 'vitest';

import {
  allExpensesApproved,
  bifallPhraseFor,
  decisionTypeFor,
  hasChildren,
  outcomeFromNormResult,
} from './beslut-outcome';
import { NormResult } from './norm-result';

const result = (value: number): NormResult => ({
  income: 0,
  norm: 0,
  expenses: 0,
  sum: value,
  specialExpenses: 0,
  result: value,
});

/** Lifecare's beslutstyper for the insats (GetProposalForService, capture 2026-09-24), trimmed. */
const TYPES = [
  {
    code: 152,
    name: 'EK Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, avslag',
    outcome: 'AVSLAG',
    requiresFromDate: true,
    requiresToDate: true,
  },
  {
    code: 153,
    name: 'Ek Ekonomiskt bistånd 12 kap 1, 7 §§ SoL, bifall',
    outcome: 'BIFALL',
    requiresFromDate: true,
    requiresToDate: true,
  },
  {
    code: 154,
    name: 'EK Ekonomiskt bistånd 12 Kap 2 § SoL, bifall',
    outcome: 'BIFALL',
    requiresFromDate: true,
    requiresToDate: true,
  },
];

describe('outcomeFromNormResult', () => {
  it('gives an avslag on a normöverskott', () => {
    expect(outcomeFromNormResult(result(1200), true)).toBe('AVSLAG');
  });

  it('gives a bifall on a normunderskott with everything approved, else a delvis bifall', () => {
    expect(outcomeFromNormResult(result(-5220), true)).toBe('BIFALL');
    expect(outcomeFromNormResult(result(-5220), false)).toBe('DELAVSLAG');
  });
});

describe('allExpensesApproved', () => {
  it('holds only when every row applied for is approved in full', () => {
    expect(allExpensesApproved({ expenses: [{ appliedAmount: 5000, effectiveAmount: 5000 }] })).toBe(true);
    expect(allExpensesApproved({ specialExpenses: [{ appliedAmount: 900, effectiveAmount: 800 }] })).toBe(false);
    // A removed row is not part of the beräkning.
    expect(allExpensesApproved({ expenses: [{ appliedAmount: 900, effectiveAmount: 0, deleted: true }] })).toBe(true);
  });
});

describe('decisionTypeFor', () => {
  it('registers bifall and delvis bifall as 12 kap 1, 7 §§ bifall, and avslag as its avslag', () => {
    expect(decisionTypeFor(TYPES, 'BIFALL')?.code).toBe(153);
    expect(decisionTypeFor(TYPES, 'DELAVSLAG')?.code).toBe(153);
    expect(decisionTypeFor(TYPES, 'AVSLAG')?.code).toBe(152);
  });
});

describe('the bifall beslutsformulering', () => {
  const phrases = [
    { identifier: 'a', category: 'Bifall', name: 'Bifall månad' },
    { identifier: 'b', category: 'Bifall', name: 'Bifall månad MED BARN' },
  ];

  it('is "Bifall månad MED BARN" with a barn or umgängesbarn in the beräkning, else "Bifall månad"', () => {
    expect(bifallPhraseFor(phrases, hasChildren({ persons: [{ role: 'CHILD', included: true }] }))?.identifier).toBe(
      'b'
    );
    expect(
      bifallPhraseFor(phrases, hasChildren({ persons: [{ role: 'VISITATION_CHILD', included: true }] }))?.identifier
    ).toBe('b');
    expect(bifallPhraseFor(phrases, hasChildren({ persons: [{ role: 'CHILD', included: false }] }))?.identifier).toBe(
      'a'
    );
  });
});
