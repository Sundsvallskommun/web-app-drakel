import { SsbtekPayment } from '@data-contracts/backend/data-contracts';

export interface SsbtekPaymentMonth {
  /** The month the payments were paid, `yyyy-MM`; undefined for payments with no date at all. */
  month?: string;
  payments: SsbtekPayment[];
}

/** The month a payment belongs to: its betalningsdag's, or its period's when the agency gives no betalningsdag. */
const monthOf = (payment: SsbtekPayment): string | undefined =>
  (payment.paidOn ?? payment.periodFrom ?? payment.periodTo)?.slice(0, 7);

/** The payments grouped by the month they were paid, keeping their order (the BFF sends them newest first). */
export const groupByPaymentMonth = (payments: SsbtekPayment[]): SsbtekPaymentMonth[] => {
  const months = new Map<string | undefined, SsbtekPayment[]>();
  payments.forEach((payment) => {
    const month = monthOf(payment);
    months.set(month, [...(months.get(month) ?? []), payment]);
  });
  return [...months.entries()].map(([month, monthPayments]) => ({ month, payments: monthPayments }));
};
