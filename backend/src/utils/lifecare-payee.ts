import { LifecarePayeeRaw } from '@interfaces/lifecare-payment.interface';

/**
 * Lifecare's sentinel payee "Adress" (Int32.MaxValue - 1): pay to the client's registered address
 * instead of an account. It is not a row in the payee register.
 */
export const ADDRESS_PAYEE_ID = 2147483646;

/** A new betalningsmottagare as the handläggare enters it. */
export interface NewLifecarePayee {
  /** The account holder. */
  name: string;
  /** The label in Lifecare's list; the account holder's name when left out. */
  payeeName?: string;
  /** Lifecare's betalsätt code. */
  paymentMethod: number;
  clearing?: string;
  accountNumber?: string;
}

const digitsOnly = (value: string | null | undefined): string => (value ?? '').replace(/\D/g, '');

/**
 * An active payee already paying to the same account with the same betalsätt, if there is one.
 *
 * Lifecare's `Payee/Create` is not idempotent, so a payee the handläggare re-enters — or one a retried
 * request already created — is looked up here instead of being created twice. Account numbers are
 * compared on their digits, since the same account is written with and without dashes.
 */
export const findMatchingPayee = (payees: LifecarePayeeRaw[], candidate: NewLifecarePayee): LifecarePayeeRaw | undefined => {
  const accountNumber = digitsOnly(candidate.accountNumber);
  if (accountNumber === '') {
    return undefined;
  }
  return payees.find(
    payee =>
      payee.isActive &&
      payee.payeeId !== ADDRESS_PAYEE_ID &&
      payee.paymentMethod === candidate.paymentMethod &&
      digitsOnly(payee.accountNumber) === accountNumber &&
      digitsOnly(payee.clearing) === digitsOnly(candidate.clearing),
  );
};

/**
 * The `Payee/Create` body, field for field as Lifecare's own web app sends it (capture 2026-09-22).
 *
 * There is no underlag to clone for a payee, so the object is built — and the mix of `null` and `""` is
 * kept exactly as captured, since Lifecare tells the two apart: the street and c/o address go as `null`,
 * postal code and clearing as empty strings.
 */
export const buildPayeeCreate = (personId: string, payee: NewLifecarePayee): LifecarePayeeRaw => ({
  payeeId: 0,
  payeeName: payee.payeeName?.trim() ? payee.payeeName.trim() : payee.name.trim(),
  personId,
  paymentMethod: payee.paymentMethod,
  paymentMethodText: null,
  accountNumber: payee.accountNumber?.trim() ?? '',
  memorialAccountNumber: null,
  clearing: payee.clearing?.trim() ?? '',
  name: payee.name.trim(),
  streetAddress: null,
  careOfAddress: null,
  postalCode: '',
  postalAddress: '',
  ocrCheck: false,
  addressFromPerson: false,
  updateTimestamp: '',
  updateSignature: null,
  isActive: true,
  statusText: null,
});
