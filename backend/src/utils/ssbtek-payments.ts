import { SsbtekBasis } from '@/data-contracts/caremanagement/data-contracts';
import { SsbtekAgencyPayment, SsbtekPayment, SsbtekPaymentsView, SsbtekPerson } from '@/responses/ssbtek.response';

import { forsakringskassanPayments } from './ssbtek-fk-payments';
import { pensionPayments } from './ssbtek-pension-payments';
import { unemploymentPayments } from './ssbtek-unemployment-payments';

/**
 * What careM answered for the medsökande: their SSBTEK basis, that the errand has no medsökande, or that it has
 * one but SSBTEK could not be read for them.
 */
export type CoApplicantBasis = { kind: 'READ'; basis: SsbtekBasis } | { kind: 'NONE' } | { kind: 'UNAVAILABLE' };

/**
 * Whether a payment falls in the period asked about: paid in it, or — when the agency gives no betalningsdag —
 * for a period that overlaps it. Dates are `yyyy-MM-dd`, so they compare as strings.
 */
const isInPeriod = (payment: SsbtekAgencyPayment, from?: string, to?: string): boolean => {
  const start = payment.paidOn ?? payment.periodFrom ?? payment.periodTo;
  const end = payment.paidOn ?? payment.periodTo ?? payment.periodFrom;
  if (start === undefined || end === undefined) {
    return true;
  }
  return (from === undefined || end >= from) && (to === undefined || start <= to);
};

/** Newest payment first, the sökandes before the medsökandes on the same day; payments without a betalningsdag last. */
const byPaidOnNewestFirst = (first: SsbtekPayment, second: SsbtekPayment): number =>
  (second.paidOn ?? '').localeCompare(first.paidOn ?? '') ||
  first.person.localeCompare(second.person) ||
  first.benefit.localeCompare(second.benefit, 'sv');

/**
 * The payments in one person's SSBTEK basis for its period, from the agencies that report payments:
 * Försäkringskassan, Pensionsmyndigheten and the a-kassor. Only the fields the payment table shows are read, so
 * nothing identifying in the verbatim agency answers — personnummer, names, addresses — leaves the BFF.
 */
const paymentsOf = (basis: SsbtekBasis, person: SsbtekPerson): SsbtekPayment[] => {
  const agencies = basis.agencies ?? {};
  return [...forsakringskassanPayments(agencies.fk), ...pensionPayments(agencies.fk), ...unemploymentPayments(agencies.so)]
    .filter(payment => isInPeriod(payment, basis.from, basis.to))
    .map(payment => ({ ...payment, person }));
};

/** The household's payments in the period — the sökandes and, when there is one, the medsökandes — newest first. */
export const toSsbtekPaymentsView = (applicant: SsbtekBasis, coApplicant: CoApplicantBasis): SsbtekPaymentsView => ({
  from: applicant.from,
  to: applicant.to,
  payments: [...paymentsOf(applicant, 'APPLICANT'), ...(coApplicant.kind === 'READ' ? paymentsOf(coApplicant.basis, 'CO_APPLICANT') : [])].sort(
    byPaidOnNewestFirst,
  ),
  hasCoApplicant: coApplicant.kind !== 'NONE',
  coApplicantUnavailable: coApplicant.kind === 'UNAVAILABLE',
});
