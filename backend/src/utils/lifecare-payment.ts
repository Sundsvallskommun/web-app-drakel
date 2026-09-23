import { LifecareBalanceRaw, LifecarePaymentForCreateRaw, LifecarePaymentRaw } from '@interfaces/lifecare-payment.interface';
import { ADDRESS_PAYEE_ID } from '@utils/lifecare-payee';

import { Payment } from '@/data-contracts/caremanagement/data-contracts';

/** How many message rows a Lifecare utbetalning has (`messageRow1`–`messageRow7`). */
const MESSAGE_ROWS = 7;

/** Either the `Payment/Create` body, or why the utbetalning cannot be sent as it stands. */
export type PaymentCreate = { writable: true; body: Record<string, unknown> } | { writable: false; reason: string };

const refuse = (reason: string): PaymentCreate => ({ writable: false, reason });

const digitsOnly = (value: string | null | undefined): string => (value ?? '').replace(/\D/g, '');

const sameName = (first: string | null | undefined, second: string | null | undefined): boolean =>
  (first ?? '').trim().toLowerCase() === (second ?? '').trim().toLowerCase();

/** careM's `yyyy-MM` month as Lifecare's `yyyyMM`. */
const toConcernMonth = (applicationMonth: string | undefined): string => (applicationMonth ?? '').replace('-', '').slice(0, 6);

/**
 * The payee the utbetalning pays to must already be in Lifecare: `Payment/Create` copies the account
 * across rather than pointing at a payee, so a payee Lifecare lacks would be invented on the spot.
 */
const payeeIsInLifecare = (underlag: LifecarePaymentForCreateRaw, payment: Payment, paymentMethodCode: number): boolean => {
  const accountNumber = digitsOnly(payment.accountNumber);
  if (accountNumber === '') {
    // No account: only Lifecare's own "Adress" entry pays without one.
    return underlag.payees.some(payee => payee.payeeId === ADDRESS_PAYEE_ID && sameName(payee.payeeName, payment.payeeName));
  }
  return underlag.payees.some(
    payee =>
      payee.isActive &&
      payee.paymentMethod === paymentMethodCode &&
      digitsOnly(payee.accountNumber) === accountNumber &&
      digitsOnly(payee.clearing) === digitsOnly(payment.clearingNumber),
  );
};

/**
 * The balance the utbetalning is booked against. `balance` goes back with an `id` field the list does
 * not have; with one balance in the capture, both its row and its `ownerId` were 1, so which one `id`
 * means is not settled. An insats with several balances is therefore refused until that is verified.
 */
const pickBalance = (balances: LifecareBalanceRaw[]): LifecareBalanceRaw | string => {
  const [balance, ...others] = balances;
  if (!balance) {
    return 'Insatsen har inget saldo i Lifecare. Finns beslutet registrerat där?';
  }
  if (others.length > 0) {
    return 'Insatsen har flera saldon i Lifecare, och det stöds inte än.';
  }
  return balance;
};

/**
 * Builds the `Payment/Create` body from Lifecare's underlag and careM's utbetalning, the way Lifecare's
 * web app does it (capture 2026-09-21): the underlag's own object in the same field order, with the
 * handläggare's choices filled in, the chosen payee's details copied flat, `aktualiseringId` taken out
 * and `creditAccount`/`simpleAccount` added.
 *
 * `Payment/Create` is not idempotent and moves money, so anything that cannot be decided safely stops
 * the utbetalning with a reason instead of being guessed: a betalsätt or month Lifecare does not offer,
 * more than one konteringsrad or balance, a balance that does not cover the amount (the beslut is then
 * not in Lifecare yet), a blocking maximum amount, or a payee Lifecare does not have.
 */
export const buildPaymentCreate = (underlag: LifecarePaymentForCreateRaw, payment: Payment): PaymentCreate => {
  const amount = payment.amount;
  if (amount === undefined || amount <= 0) {
    return refuse('Utbetalningen saknar belopp.');
  }

  const method = underlag.paymentMethods.find(candidate => candidate.inUse && sameName(candidate.payment, payment.paymentMethod));
  if (!method) {
    return refuse(`Betalsättet "${payment.paymentMethod ?? ''}" finns inte på insatsen i Lifecare.`);
  }

  const concernedMonth = toConcernMonth(payment.applicationMonth);
  if (!(underlag.paymentConcernMonths ?? []).some(month => month.concernMonth === concernedMonth)) {
    return refuse(`Lifecare tar inte emot utbetalningar för månaden ${payment.applicationMonth ?? ''}.`);
  }

  const [posting, ...otherPostings] = underlag.payment.postings ?? [];
  if (!posting || otherPostings.length > 0) {
    return refuse('Insatsen har flera konteringsrader i Lifecare, och fördelning av beloppet stöds inte än.');
  }

  const balance = pickBalance(underlag.balances ?? []);
  if (typeof balance === 'string') {
    return refuse(balance);
  }
  if (balance.balanceAmount < amount) {
    return refuse(`Saldot i Lifecare (${String(balance.balanceAmount)} kr) räcker inte till ${String(amount)} kr. Finns beslutet registrerat där?`);
  }

  const maxAmount = underlag.payment.maxAmountForPayment;
  if (typeof maxAmount === 'number' && amount > maxAmount && underlag.payment.notificationOnlyOfMaxAmountForPaymentActivated !== true) {
    return refuse(`Beloppet är över Lifecares maxbelopp för en utbetalning (${String(maxAmount)} kr).`);
  }

  if (!payeeIsInLifecare(underlag, payment, method.paymentCode)) {
    return refuse('Mottagaren finns inte i Lifecare. Lägg till den där först.');
  }

  const balanceId = balance.ownerId;
  const messageLines = payment.messageLines ?? [];
  // Assigning onto a copy keeps each field where the underlag had it; only the added fields go last.
  const body: LifecarePaymentRaw = { ...underlag.payment };
  body.amount = amount;
  body.paymentMethod = method.paymentCode;
  body.payDate = payment.paymentDate ?? body.payDate;
  body.concernedMonth = concernedMonth;
  body.clearing = payment.clearingNumber ?? '';
  body.accountNumber = payment.accountNumber ?? '';
  body.name = payment.payeeName ?? '';
  body.streetAddress = payment.payeeAddress ?? '';
  body.careOfAddress = payment.payeeCareOf ?? '';
  body.postalCode = payment.payeeZipCode ?? '';
  body.postalAddress = payment.payeeCity ?? '';
  body.billingNumber = payment.invoiceNumber ?? null;
  body.localNumber = payment.localPaymentNumber ?? '';
  body.ocrCheck = payment.usesOcr ?? false;
  for (let row = 1; row <= MESSAGE_ROWS; row++) {
    body[`messageRow${String(row)}`] = messageLines[row - 1] ?? '';
  }
  body.balance = { ...balance, id: balanceId };
  body.paymentPersons = (underlag.payment.paymentPersons ?? []).map(person => ({
    ...person,
    personIdAndName: `${person.personIdFormatted ?? ''} ${person.name ?? ''}`,
  }));
  body.postings = [{ ...posting, amount }];
  body.balanceId = balanceId;
  delete body.aktualiseringId;
  body.creditAccount = '';
  body.simpleAccount = '';

  return { writable: true, body };
};
