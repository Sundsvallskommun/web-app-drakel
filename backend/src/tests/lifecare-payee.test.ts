import { LifecarePayeeRaw } from '@interfaces/lifecare-payment.interface';
import { ADDRESS_PAYEE_ID, buildPayeeCreate, findMatchingPayee } from '@utils/lifecare-payee';
import { describe, expect, it } from 'vitest';

const payee = (overrides: Partial<LifecarePayeeRaw>): LifecarePayeeRaw => ({
  payeeId: 2,
  payeeName: 'Konto A',
  personId: '19800101T001',
  paymentMethod: 14,
  paymentMethodText: 'Bankgiro via Plusgiro',
  accountNumber: '1111-1111',
  memorialAccountNumber: null,
  clearing: '',
  name: 'Kontoinnehavare A',
  streetAddress: '',
  careOfAddress: '',
  postalCode: '',
  postalAddress: 'Sundsvall',
  ocrCheck: false,
  addressFromPerson: false,
  updateTimestamp: '2026-09-11',
  updateSignature: 'handlaggare1',
  isActive: true,
  statusText: null,
  ...overrides,
});

describe('findMatchingPayee', () => {
  it('finds an active payee on the same account and betalsätt, dashes or not', () => {
    const payees = [payee({})];

    expect(findMatchingPayee(payees, { name: 'Ny', paymentMethod: 14, accountNumber: '11111111' })?.payeeId).toBe(2);
  });

  it('does not match another betalsätt, an inactive payee or the Adress entry', () => {
    const payees = [
      payee({ paymentMethod: 13 }),
      payee({ payeeId: 5, isActive: false }),
      payee({ payeeId: ADDRESS_PAYEE_ID, accountNumber: '11111111' }),
    ];

    expect(findMatchingPayee(payees, { name: 'Ny', paymentMethod: 14, accountNumber: '11111111' })).toBeUndefined();
  });

  it('never matches without an account number to compare', () => {
    expect(findMatchingPayee([payee({ accountNumber: '' })], { name: 'Ny', paymentMethod: 14 })).toBeUndefined();
  });
});

describe('buildPayeeCreate', () => {
  it('builds the body field for field as the Lifecare web app sends it', () => {
    const body = buildPayeeCreate('19800101T001', { name: 'Kontoinnehavare B', payeeName: 'Konto B', paymentMethod: 14, accountNumber: '11111111' });

    // Order and the null/"" mix copied from the capture of Payee/Create.
    expect(JSON.stringify(body)).toBe(
      JSON.stringify({
        payeeId: 0,
        payeeName: 'Konto B',
        personId: '19800101T001',
        paymentMethod: 14,
        paymentMethodText: null,
        accountNumber: '11111111',
        memorialAccountNumber: null,
        clearing: '',
        name: 'Kontoinnehavare B',
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
      }),
    );
  });

  it('labels the payee by the account holder when no label is given', () => {
    expect(buildPayeeCreate('19800101T001', { name: 'Kontoinnehavare B', paymentMethod: 14 }).payeeName).toBe('Kontoinnehavare B');
  });
});
