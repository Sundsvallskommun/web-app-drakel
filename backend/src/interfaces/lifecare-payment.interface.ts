/**
 * A betalningsmottagare as Lifecare's `GetPaymentForCreate` lists it, and as `Payee/Create` answers.
 *
 * Carries bank account numbers, names and addresses: never log it, not even in part.
 */
export interface LifecarePayeeRaw {
  payeeId: number;
  /** The label the payee has in Lifecare's list — not the account holder, which is `name`. */
  payeeName: string | null;
  personId: string | null;
  /** Lifecare's betalsätt code, e.g. 14 for Bankgiro via Plusgiro. */
  paymentMethod: number;
  paymentMethodText: string | null;
  accountNumber: string | null;
  memorialAccountNumber: string | null;
  clearing: string | null;
  /** The account holder. */
  name: string | null;
  streetAddress: string | null;
  careOfAddress: string | null;
  postalCode: string | null;
  postalAddress: string | null;
  ocrCheck: boolean;
  addressFromPerson: boolean;
  updateTimestamp: string;
  updateSignature: string | null;
  isActive: boolean;
  statusText: string | null;
}

/** One betalsätt as Lifecare's `GetPaymentForCreate` lists it for the insats. */
export interface LifecarePaymentMethodRaw {
  paymentCode: number;
  /** The betalsätt's name, e.g. "Bankgiro via Plusgiro". */
  payment: string;
  inUse: boolean;
  localNumberEnabled: boolean;
  localNumberMandatory: boolean;
}

/** One konteringsrad on an utbetalning; the amount is spread over these per `purpose`. */
export interface LifecarePostingRaw {
  amount: number;
  purpose: number;
  purposeText: string | null;
  [field: string]: unknown;
}

/** A person the utbetalning concerns. The web app adds `personIdAndName` to each before saving. */
interface LifecarePaymentPersonRaw {
  name: string | null;
  personIdFormatted: string | null;
  [field: string]: unknown;
}

/** One saldo on the insats — what the beslut granted, what is booked and what is left. */
export interface LifecareBalanceRaw {
  serviceId: number;
  ownerType: number;
  ownerId: number;
  paymentType: number;
  approvedAmount: number;
  bookedAmount: number;
  name: string;
  balanceAmount: number;
}

/** A month an utbetalning may concern, e.g. `{ concernMonth: "202609", displayMonth: "September 2026" }`. */
interface LifecareConcernMonthRaw {
  concernMonth: string;
  displayMonth: string;
}

/**
 * The blank utbetalning in Lifecare's underlag. `Payment/Create` takes this very object back, in the
 * same field order, with a handful of fields filled in — so only those are named and the rest is
 * carried along untouched.
 */
export interface LifecarePaymentRaw {
  susPersonId?: string | null;
  maxAmountForPayment?: number | null;
  notificationOnlyOfMaxAmountForPaymentActivated?: boolean;
  postings?: LifecarePostingRaw[];
  paymentPersons?: LifecarePaymentPersonRaw[];
  [field: string]: unknown;
}

/**
 * Lifecare's underlag for a new utbetalning on an insats — the most sensitive answer in its API.
 * Besides the blank payment it lists the person's payees with their accounts, and `payment.susPersonId`
 * is the personnummer. Never log it. Only the parts drakel reads are named; the rest is carried along.
 */
export interface LifecarePaymentForCreateRaw {
  payment: LifecarePaymentRaw;
  payees: LifecarePayeeRaw[];
  paymentMethods: LifecarePaymentMethodRaw[];
  paymentConcernMonths?: LifecareConcernMonthRaw[];
  balances?: LifecareBalanceRaw[];
  [field: string]: unknown;
}

/**
 * An utbetalning already registered on the insats, as `Payment/GetLatestPayments` lists it. Only the
 * fields that identify it are named; the row carries the account and more, so never log it.
 */
export interface LifecareRegisteredPaymentRaw {
  paymentId: number;
  amount: number;
  payDate: string;
  concernedMonth: string | null;
  paymentMethodText?: string | null;
  /** Who the utbetalning goes to — the account holder or addressee copied from the payee. */
  name?: string | null;
  accountNumber: string | null;
  statusText?: string | null;
  /** Empty until the utbetalning is makulerad. */
  cancellationDate: string;
  [field: string]: unknown;
}

/** The utbetalning `Payment/Create` answers with. Its id is `paymentId` — not `id`, unlike documents. */
export interface LifecareCreatedPaymentRaw {
  paymentId: number;
  [field: string]: unknown;
}
