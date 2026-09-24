import { SsbtekPayment, SsbtekPaymentPart } from '@/responses/ssbtek.response';

import { asList, descriptionOf, fieldAt, numberOf, periodOf, SsbtekPeriod, textOf } from './ssbtek-json';

const FALLBACK_BENEFIT = 'Pension';

/** The agency behind a row, from its förmånsgrupp code's prefix ("PM:AP" → PM). Pensionsmyndigheten unless it says otherwise. */
const sourceOf = (rows: unknown[]): string => {
  const code = textOf(fieldAt(rows[0], 'formansgrupp', 'kod'));
  return code?.includes(':') ? code.slice(0, code.indexOf(':')) : 'PM';
};

/** Whether a deduction is the preliminary tax ("PM:PS", "Preliminär skatt") rather than another avdrag. */
const isTax = (deduction: unknown): boolean => {
  const code = textOf(fieldAt(deduction, 'avdragstyp', 'kod')) ?? '';
  const description = descriptionOf(fieldAt(deduction, 'avdragstyp')) ?? '';
  return code.endsWith(':PS') || description.toLowerCase().includes('skatt');
};

/** The sum of the deductions, as a positive amount (the agency writes them negative); undefined when there are none. */
const sumOf = (deductions: unknown[]): number | undefined => {
  const amounts = deductions.flatMap(deduction => {
    const amount = numberOf(fieldAt(deduction, 'belopp'));
    return amount === undefined ? [] : [Math.abs(amount)];
  });
  return amounts.length === 0 ? undefined : amounts.reduce((sum, amount) => sum + amount, 0);
};

/** The payment's förmåner, each named once in the order they come: "Bostadstillägg, Efterlevandepension". */
const benefitsOf = (rows: unknown[]): string | undefined => {
  const names = rows.flatMap(row => {
    const name = descriptionOf(fieldAt(row, 'utbetalningsforman')) ?? descriptionOf(fieldAt(row, 'formansgrupp'));
    return name ? [name] : [];
  });
  return names.length === 0 ? undefined : [...new Set(names)].join(', ');
};

const toPart = (row: unknown, period: SsbtekPeriod): SsbtekPaymentPart => ({
  benefit: descriptionOf(fieldAt(row, 'utbetalningsforman')),
  amountType: descriptionOf(fieldAt(row, 'beloppstyp')),
  periodFrom: period.from,
  periodTo: period.to,
  grossAmount: numberOf(fieldAt(row, 'belopp')),
});

const toPayment = (item: unknown, preliminary: boolean): SsbtekPayment => {
  const rows = asList(fieldAt(item, 'utbetalningsrader'));
  const deductions = asList(fieldAt(item, 'avdrag'));
  const period = periodOf(fieldAt(item, 'utbetalningsperiod'));
  return {
    source: sourceOf(rows),
    benefit: benefitsOf(rows) ?? FALLBACK_BENEFIT,
    paidOn: textOf(fieldAt(item, 'utbetalningsdatum')),
    type: preliminary ? 'Preliminär' : undefined,
    netAmount: numberOf(fieldAt(item, 'nettobelopp')),
    grossAmount: numberOf(fieldAt(item, 'bruttobelopp')),
    deductionAmount: sumOf(deductions.filter(deduction => !isTax(deduction))),
    taxAmount: sumOf(deductions.filter(isTax)),
    periodFrom: period.from,
    periodTo: period.to,
    preliminary,
    parts: rows.map(row => toPart(row, period)),
  };
};

/**
 * Pensionsmyndigheten's payments — the made ones (utbetalningar) and the announced ones (preliminaraUtbetalningar),
 * which SSBTEK answers at the top of Försäkringskassan's answer — each specified per förmån (utbetalningsrader).
 */
export const pensionPayments = (fkAnswer: unknown): SsbtekPayment[] => [
  ...asList(fieldAt(fkAnswer, 'utbetalningar')).map(item => toPayment(item, false)),
  ...asList(fieldAt(fkAnswer, 'preliminaraUtbetalningar')).map(item => toPayment(item, true)),
];
