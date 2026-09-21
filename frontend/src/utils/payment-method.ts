/**
 * The Lifecare "Betalsätt" (payment method) of an utbetalning, and which recipient fields each one
 * makes editable.
 *
 * The rule mirrors the Lifecare utbetalningsformulär: until a betalsätt is chosen every
 * recipient-detail field stays disabled, and choosing one opens exactly the fields that betalsätt
 * needs. The caremanagement API does not describe this — it exposes an utbetalning only as the
 * untyped `parameters` map of the `REGISTER_PAYMENT` RPA task — so the grouping below is modelled on
 * the Lifecare form and needs confirming with the RPA/Lifecare team before it drives real
 * registrations.
 */
export const PAYMENT_METHODS = ['BANK_ACCOUNT', 'PAYMENT_CARD', 'LOCAL_PAYMENT', 'INVOICE'] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Which groups of recipient fields the chosen betalsätt makes editable. */
export interface EditableRecipientFields {
  /** C/O adress, Postnummer and Ort — the postal address an utbetalningskort is sent to. */
  postalAddress: boolean;
  /** Clearing and Kontonummer. */
  bankAccount: boolean;
  /** Lokalbetalningsnummer. */
  localPaymentNumber: boolean;
  /** Räkningsnummer and OCR. */
  invoiceReference: boolean;
}

const NO_EDITABLE_FIELDS: EditableRecipientFields = {
  postalAddress: false,
  bankAccount: false,
  localPaymentNumber: false,
  invoiceReference: false,
};

const EDITABLE_FIELDS_BY_PAYMENT_METHOD: Record<PaymentMethod, EditableRecipientFields> = {
  BANK_ACCOUNT: { ...NO_EDITABLE_FIELDS, bankAccount: true },
  PAYMENT_CARD: { ...NO_EDITABLE_FIELDS, postalAddress: true },
  LOCAL_PAYMENT: { ...NO_EDITABLE_FIELDS, localPaymentNumber: true },
  INVOICE: { ...NO_EDITABLE_FIELDS, postalAddress: true, invoiceReference: true },
};

/**
 * The recipient fields the chosen betalsätt opens up. An unset or unknown betalsätt opens none, which
 * is why the form starts out with every recipient-detail field disabled.
 */
export const getEditableRecipientFields = (paymentMethod: string): EditableRecipientFields =>
  EDITABLE_FIELDS_BY_PAYMENT_METHOD[paymentMethod as PaymentMethod] ?? NO_EDITABLE_FIELDS;
