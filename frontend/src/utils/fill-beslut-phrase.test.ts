import { describe, expect, it } from 'vitest';

import { fillBeslutPhrase, formatPhrasePeriod } from './fill-beslut-phrase';

// Swedish grouping separates thousands with a no-break space.
const NBSP = '\u00a0';

const phrase = '¤ beviljas ekonomiskt bistånd med ¥ kronor för ※, se beräkning.';

describe('fillBeslutPhrase', () => {
  it('fills name, belopp and period from the errand', () => {
    expect(
      fillBeslutPhrase(phrase, {
        applicantName: 'Test Testsson',
        amount: 3000,
        periodFrom: '2026-09-01',
        periodTo: '2026-09-30',
      })
    ).toBe(`Test Testsson beviljas ekonomiskt bistånd med 3${NBSP}000 kronor för september 2026, se beräkning.`);
  });

  it('keeps the öre when the belopp has them', () => {
    expect(fillBeslutPhrase('¥ kronor', { amount: 1234.5 })).toBe(`1${NBSP}234,5 kronor`);
  });

  it('leaves a placeholder the errand has no value for, so it is seen and written by hand', () => {
    expect(fillBeslutPhrase(phrase, { applicantName: 'Test Testsson' })).toBe(
      'Test Testsson beviljas ekonomiskt bistånd med ¥ kronor för ※, se beräkning.'
    );
  });

  it('does not touch a paragraph sign in a legal reference', () => {
    expect(fillBeslutPhrase('enligt 12 kap. 1 § socialtjänstlagen', { amount: 100 })).toBe(
      'enligt 12 kap. 1 § socialtjänstlagen'
    );
  });
});

describe('formatPhrasePeriod', () => {
  it('names a whole month', () => {
    expect(formatPhrasePeriod('2026-02-01', '2026-02-28')).toBe('februari 2026');
  });

  it('spells out any other period', () => {
    expect(formatPhrasePeriod('2026-09-01', '2026-09-15')).toBe('2026-09-01 – 2026-09-15');
  });

  it('has nothing to say without both ends', () => {
    expect(formatPhrasePeriod('2026-09-01', undefined)).toBeUndefined();
  });
});
