import { Payment } from '@services/payment-service';

/** What remains of a decided amount after the utbetalningar registered against it. */
export interface PaymentDisposal {
  decided: number;
  /** Everything committed: every registered utbetalning, since that money is already earmarked. */
  committed: number;
  remaining: number;
}

/**
 * Works out how much of a decision is left to pay out.
 *
 * Every registered utbetalning counts: caremanagement's statuses are DRAFT and PENDING_REGISTRATION, and
 * neither frees its amount again — a DRAFT is money a handläggare has already set aside, and showing it
 * as still available would invite paying it twice. If a status for a payment that never reached Lifecare
 * is added, it should stop counting here. Confirm that reading with verksamheten before it drives
 * anything but the summary text.
 */
export const paymentDisposal = (decidedAmount: number | undefined, payments: Payment[]): PaymentDisposal => {
  const decided = decidedAmount ?? 0;
  const committed = payments.reduce((sum, payment) => sum + (payment.amount ?? 0), 0);

  return { decided, committed, remaining: decided - committed };
};
