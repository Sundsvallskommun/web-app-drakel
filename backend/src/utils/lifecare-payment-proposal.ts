import { LifecarePaymentForCreateRaw, LifecareRegisteredPaymentRaw } from '@interfaces/lifecare-payment.interface';

const digitsOnly = (value: string | null | undefined): string => (value ?? '').replace(/\D/g, '');

/** Lifecare's `yyyyMM` as `yyyy-MM`; anything else is passed on as it came. */
export const toMonth = (concernedMonth: string | null): string =>
  concernedMonth && /^\d{6}$/.test(concernedMonth) ? `${concernedMonth.slice(0, 4)}-${concernedMonth.slice(4)}` : (concernedMonth ?? '');

/** The most recent utbetalning on the insats that still stands (not makulerad). */
const latestStanding = (registered: LifecareRegisteredPaymentRaw[]): LifecareRegisteredPaymentRaw | undefined =>
  [...registered].filter(payment => payment.cancellationDate === '').sort((first, second) => second.payDate.localeCompare(first.payDate))[0];

/** What the utbetalning form starts from — all of it Lifecare's own figures. */
export interface LifecarePaymentProposal {
  /** Lifecare's proposed utbetalningsdatum. */
  paymentDate?: string;
  /** The first month Lifecare lets an utbetalning concern, `yyyy-MM`. */
  concernedMonth?: string;
  /** What is left on the insats's saldo — what the beslut still allows to be paid out. */
  amount?: number;
  /** The payee the latest utbetalning on the insats went to, when it is still in the payee register. */
  payeeId?: number;
}

/**
 * The utbetalning form's starting point, out of Lifecare alone: its proposed date, its first open month,
 * what is left on the saldo, and the payee the insats was last paid to. Everything is a proposal the
 * handläggare can change.
 */
export const toPaymentProposal = (underlag: LifecarePaymentForCreateRaw, registered: LifecareRegisteredPaymentRaw[]): LifecarePaymentProposal => {
  const remaining = (underlag.balances ?? []).reduce((sum, balance) => sum + balance.balanceAmount, 0);
  const latest = latestStanding(registered);
  const latestAccount = digitsOnly(latest?.accountNumber);
  const payee =
    latestAccount === '' ? undefined : underlag.payees.find(candidate => candidate.isActive && digitsOnly(candidate.accountNumber) === latestAccount);

  return {
    paymentDate: typeof underlag.payment.payDate === 'string' ? underlag.payment.payDate : undefined,
    concernedMonth: underlag.paymentConcernMonths?.[0] ? toMonth(underlag.paymentConcernMonths[0].concernMonth) : undefined,
    amount: remaining > 0 ? remaining : undefined,
    payeeId: payee?.payeeId,
  };
};

/**
 * Whether the utbetalning for a month has been made: an utbetalning on the insats concerning that month
 * that is not makulerad. The same reading careM made, only from Lifecare directly.
 */
export const paymentForMonth = (registered: LifecareRegisteredPaymentRaw[], applicationMonth: string): LifecareRegisteredPaymentRaw | undefined => {
  const month = applicationMonth.replace('-', '');
  return latestStanding(registered.filter(payment => payment.concernedMonth === month));
};
