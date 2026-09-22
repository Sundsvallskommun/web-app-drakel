/**
 * Which recipient fields a Lifecare "Betalsätt" makes editable.
 *
 * The betalsätt catalogue comes from caremanagement's metadata and holds five values, transcribed from
 * verksamhetens screenshots of the Lifecare dropdown. They are listed explicitly rather than matched on
 * substrings: "Bankkonto via Plusgiro" contains both "konto" and "giro", and any word-matching rule has
 * to decide which wins — silently, and differently depending on the order of the checks.
 *
 * The grouping below is a reading of what each betalsätt pays to, not something the API states. The two
 * worth confirming with verksamheten are "Bankkonto via Plusgiro" (treated as a bank account, so it
 * carries a clearing number) and "Memorial" (treated as an internal entry with no external account).
 * An unrecognised betalsätt deliberately opens nothing rather than guessing.
 */
export interface EditableRecipientFields {
  /** C/O adress, Postnummer and Ort — a postal address rather than an account. */
  postalAddress: boolean;
  /** Clearing — only a bank account has one; a giro number does not. */
  clearingNumber: boolean;
  /** Kontonummer, which also holds a bankgiro or plusgiro number. */
  accountNumber: boolean;
}

const NOTHING: EditableRecipientFields = { postalAddress: false, clearingNumber: false, accountNumber: false };
const BANK_ACCOUNT: EditableRecipientFields = { ...NOTHING, clearingNumber: true, accountNumber: true };
const GIRO: EditableRecipientFields = { ...NOTHING, accountNumber: true };

const FIELDS_BY_PAYMENT_METHOD: Record<string, EditableRecipientFields> = {
  Personkonto: BANK_ACCOUNT,
  'Bankkonto via Plusgiro': BANK_ACCOUNT,
  'Bankgiro via Plusgiro': GIRO,
  Plusgiro: GIRO,
  Memorial: NOTHING,
};

/**
 * The recipient fields the chosen betalsätt opens up. Nothing is editable until a betalsätt is chosen,
 * which is why the form starts out with every one of these fields disabled.
 */
export const getEditableRecipientFields = (paymentMethod: string): EditableRecipientFields =>
  FIELDS_BY_PAYMENT_METHOD[paymentMethod] ?? NOTHING;
