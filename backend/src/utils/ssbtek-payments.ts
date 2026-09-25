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

/** What careM answered for one of the ansökan's children: their SSBTEK basis, or none when it could not be read. */
export interface ChildBasis {
  name?: string;
  basis?: SsbtekBasis;
}

/** The household in the order the table lists a day's payments: sökande, medsökande, children. */
const PERSON_ORDER: Record<SsbtekPerson, number> = { APPLICANT: 0, CO_APPLICANT: 1, CHILD: 2 };

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

/**
 * Newest payment first — on the same day the sökandes, then the medsökandes, then the children's — and payments
 * without a betalningsdag last.
 */
const byPaidOnNewestFirst = (first: SsbtekPayment, second: SsbtekPayment): number =>
  (second.paidOn ?? '').localeCompare(first.paidOn ?? '') ||
  PERSON_ORDER[first.person] - PERSON_ORDER[second.person] ||
  (first.childName ?? '').localeCompare(second.childName ?? '', 'sv') ||
  first.benefit.localeCompare(second.benefit, 'sv');

/**
 * The payments in one person's SSBTEK basis for its period, from the agencies that report payments:
 * Försäkringskassan, Pensionsmyndigheten and the a-kassor. Only the fields the payment table shows are read, so
 * nothing identifying in the verbatim agency answers — personnummer, names, addresses — leaves the BFF.
 */
const paymentsOf = (basis: SsbtekBasis, person: SsbtekPerson, childName?: string): SsbtekPayment[] => {
  const agencies = basis.agencies ?? {};
  return [...forsakringskassanPayments(agencies.fk), ...pensionPayments(agencies.fk), ...unemploymentPayments(agencies.so)]
    .filter(payment => isInPeriod(payment, basis.from, basis.to))
    .map(payment => ({ ...payment, person, childName }));
};

/** The children's payments, each child's tagged with its name. */
const childrensPayments = (children: ChildBasis[]): SsbtekPayment[] =>
  children.flatMap(child => (child.basis ? paymentsOf(child.basis, 'CHILD', child.name) : []));

/**
 * The household's payments in the period — the sökandes and, when the errand has them, the medsökandes and the
 * children's — newest first.
 */
export const toSsbtekPaymentsView = (applicant: SsbtekBasis, coApplicant: CoApplicantBasis, children: ChildBasis[]): SsbtekPaymentsView => ({
  from: applicant.from,
  to: applicant.to,
  payments: [
    ...paymentsOf(applicant, 'APPLICANT'),
    ...(coApplicant.kind === 'READ' ? paymentsOf(coApplicant.basis, 'CO_APPLICANT') : []),
    ...childrensPayments(children),
  ].sort(byPaidOnNewestFirst),
  hasCoApplicant: coApplicant.kind !== 'NONE',
  coApplicantUnavailable: coApplicant.kind === 'UNAVAILABLE',
  hasChildren: children.length > 0,
  unavailableChildren: children.filter(child => !child.basis).map(child => child.name ?? ''),
});
