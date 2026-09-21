/**
 * Which recipient fields a Lifecare "Betalsätt" makes editable.
 *
 * caremanagement exposes the betalsätt as free text — "the Lifecare payment method, e.g. bank account,
 * bankgiro, plusgiro or utbetalningskort" — not as an enum, and the payment proposal carries whatever
 * string Lifecare stored. The grouping below therefore matches on the Swedish words rather than on
 * fixed codes, and an unrecognised betalsätt deliberately opens nothing instead of guessing.
 *
 * Confirm the exact spellings with the RPA/Lifecare team before this drives real registrations.
 */
export interface EditableRecipientFields {
  /** C/O adress, Postnummer and Ort — the postal address an utbetalningskort is sent to. */
  postalAddress: boolean;
  /** Clearing — only a bank account has one; a giro number does not. */
  clearingNumber: boolean;
  /** Kontonummer, which also holds a bankgiro or plusgiro number. */
  accountNumber: boolean;
}

const NO_EDITABLE_FIELDS: EditableRecipientFields = {
  postalAddress: false,
  clearingNumber: false,
  accountNumber: false,
};

/**
 * The recipient fields the chosen betalsätt opens up. Nothing is editable until a betalsätt is chosen,
 * which is why the form starts out with every one of these fields disabled.
 */
export const getEditableRecipientFields = (paymentMethod: string): EditableRecipientFields => {
  const method = paymentMethod.toLowerCase();

  if (method.includes('kort')) {
    // Utbetalningskort is posted to an address rather than paid to an account.
    return { ...NO_EDITABLE_FIELDS, postalAddress: true };
  }
  if (method.includes('giro')) {
    // Bankgiro and plusgiro numbers go in Kontonummer and have no clearing number.
    return { ...NO_EDITABLE_FIELDS, accountNumber: true };
  }
  if (method.includes('konto')) {
    return { ...NO_EDITABLE_FIELDS, clearingNumber: true, accountNumber: true };
  }
  return NO_EDITABLE_FIELDS;
};
