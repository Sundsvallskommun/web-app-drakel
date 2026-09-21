import { Payment } from '@services/payment-service';

/** What remains of a decided amount after the utbetalningar registered against it. */
export interface PaymentDisposal {
  decided: number;
  /** Everything committed: drafts and queued rows count, since that money is already earmarked. */
  committed: number;
  remaining: number;
}

/**
 * Works out how much of a decision is left to pay out.
 *
 * A FAILED payment never reached Lifecare, so it frees its amount again; everything else counts —
 * a DRAFT is money a handläggare has already set aside, and showing it as still available would
 * invite paying it twice. Confirm that reading with verksamheten before it drives anything but the
 * summary text.
 */
export const paymentDisposal = (decidedAmount: number | undefined, payments: Payment[]): PaymentDisposal => {
  const decided = decidedAmount ?? 0;
  const committed = payments
    .filter((payment) => payment.status !== 'FAILED')
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

  return { decided, committed, remaining: decided - committed };
};
