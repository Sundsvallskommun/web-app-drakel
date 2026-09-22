import { describe, expect, it } from 'vitest';

import { getEditableRecipientFields } from './payment-method';

describe('getEditableRecipientFields', () => {
  it('opens clearing and account for a personkonto', () => {
    expect(getEditableRecipientFields('Personkonto')).toMatchObject({ clearingNumber: true, accountNumber: true });
  });

  it('treats "Bankkonto via Plusgiro" as a bank account, not as a giro', () => {
    // It holds both "konto" and "giro"; a substring rule would pick whichever check ran first.
    expect(getEditableRecipientFields('Bankkonto via Plusgiro')).toMatchObject({
      clearingNumber: true,
      accountNumber: true,
    });
  });

  it('opens only the account number for a giro', () => {
    expect(getEditableRecipientFields('Plusgiro')).toMatchObject({ clearingNumber: false, accountNumber: true });
    expect(getEditableRecipientFields('Bankgiro via Plusgiro')).toMatchObject({
      clearingNumber: false,
      accountNumber: true,
    });
  });

  it('opens nothing for Memorial', () => {
    expect(getEditableRecipientFields('Memorial')).toMatchObject({ clearingNumber: false, accountNumber: false });
  });

  it('opens nothing for an unknown or unset betalsätt', () => {
    expect(getEditableRecipientFields('')).toMatchObject({ clearingNumber: false, accountNumber: false });
    expect(getEditableRecipientFields('Något nytt')).toMatchObject({ clearingNumber: false, accountNumber: false });
  });
});
