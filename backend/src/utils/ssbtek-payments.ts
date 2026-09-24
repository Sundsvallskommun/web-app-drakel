import { SsbtekBasis } from '@/data-contracts/caremanagement/data-contracts';
import { SsbtekPayment, SsbtekPaymentsView } from '@/responses/ssbtek.response';

import { forsakringskassanPayments } from './ssbtek-fk-payments';
import { pensionPayments } from './ssbtek-pension-payments';
import { unemploymentPayments } from './ssbtek-unemployment-payments';

/**
 * Whether a payment falls in the period asked about: paid in it, or — when the agency gives no betalningsdag —
 * for a period that overlaps it. Dates are `yyyy-MM-dd`, so they compare as strings.
 */
const isInPeriod = (payment: SsbtekPayment, from?: string, to?: string): boolean => {
  const start = payment.paidOn ?? payment.periodFrom ?? payment.periodTo;
  const end = payment.paidOn ?? payment.periodTo ?? payment.periodFrom;
  if (start === undefined || end === undefined) {
    return true;
  }
  return (from === undefined || end >= from) && (to === undefined || start <= to);
};

/** Newest payment first; payments without a betalningsdag last. */
const byPaidOnNewestFirst = (first: SsbtekPayment, second: SsbtekPayment): number =>
  (second.paidOn ?? '').localeCompare(first.paidOn ?? '') || first.benefit.localeCompare(second.benefit, 'sv');

/**
 * The payments SSBTEK reports in the period, from the agencies that report payments: Försäkringskassan,
 * Pensionsmyndigheten and the a-kassor. Only the fields the payment table shows are read, so nothing identifying
 * in the verbatim agency answers — personnummer, names, addresses — leaves the BFF.
 */
export const toSsbtekPaymentsView = (basis: SsbtekBasis): SsbtekPaymentsView => {
  const agencies = basis.agencies ?? {};
  const payments = [...forsakringskassanPayments(agencies.fk), ...pensionPayments(agencies.fk), ...unemploymentPayments(agencies.so)];
  return {
    from: basis.from,
    to: basis.to,
    payments: payments.filter(payment => isInPeriod(payment, basis.from, basis.to)).sort(byPaidOnNewestFirst),
  };
};
