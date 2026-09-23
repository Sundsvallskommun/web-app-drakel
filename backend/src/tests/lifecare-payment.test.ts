import { LifecarePaymentForCreateRaw } from '@interfaces/lifecare-payment.interface';
import { buildPaymentCreate } from '@utils/lifecare-payment';
import { describe, expect, it } from 'vitest';

import { Payment } from '@/data-contracts/caremanagement/data-contracts';

// A short stand-in for the 245-space message field; it is carried through untouched either way.
const BLANK_MESSAGE = '     ';

/** Capture 1 (GET Payment/GetPaymentForCreate, 2026-09-21) with the payment's fields in their own order. */
const underlag = (): LifecarePaymentForCreateRaw => ({
  payment: {
    paymentId: 0,
    serviceId: 1,
    amount: 0.0,
    chainId: 2,
    investigationExecutionId: 2,
    paymentType: 0,
    paymentMethod: 0,
    paymentMethodText: null,
    payDate: '2026-09-21',
    concernedMonth: null,
    concernedMonthText: null,
    bookkeepingDate: '',
    integrationDate: '',
    cancellationDate: '',
    updateTimestamp: '',
    updateSignature: null,
    cancellationSignature: null,
    status: 0,
    statusText: null,
    error: 0,
    noIntegration: false,
    clearing: null,
    accountNumber: null,
    memorialAccountNumber: null,
    name: null,
    streetAddress: null,
    careOfAddress: null,
    postalCode: null,
    postalAddress: null,
    billingNumber: null,
    localNumber: null,
    ocrCheck: false,
    voucherNumber: null,
    susPersonId: '19800101T001',
    aktualiseringId: null,
    applicationText: null,
    maxAmountForPayment: 1000.0,
    notificationOnlyOfMaxAmountForPaymentActivated: true,
    message: BLANK_MESSAGE,
    messageRow1: null,
    messageRow2: null,
    messageRow3: null,
    messageRow4: null,
    messageRow5: null,
    messageRow6: null,
    messageRow7: null,
    balance: null,
    paymentPersons: [
      {
        paymentId: 0,
        personId: '19800101T001',
        name: 'Efternamn, Förnamn',
        personKey: 0,
        included: true,
        susPerson: false,
        streetAddress: null,
        careOfAddress: null,
        postalCode: null,
        postalAddress: null,
        personIdFormatted: '800101-T001',
      },
    ],
    postings: [
      {
        paymentId: 0,
        account: 'TEST UTB',
        creditAccount: null,
        simpleAccount: '',
        amount: 0.0,
        simpleCreditAccount: null,
        purpose: 1,
        purposeText: 'Försörjningsstöd exklusive tillfälligt boende',
      },
    ],
    economicUnit: {
      economicalUnitId: 1,
      name: 'Ekonomiskt bistånd',
      startDate: '2026-09-01',
      endDate: '',
      giroUnit: 'IFO',
      voucherNumberIn: '0',
      voucherNumberOut: '0',
      paymentRecieverOblig: true,
    },
    serviceOrganizationText: 'Mottagning ekonomiskt bistånd',
    balanceId: 0,
    dontShowOnMyPage: false,
    maxPaymentYears: 0,
  },
  payees: [
    {
      payeeId: 2,
      payeeName: 'Konto A',
      personId: '19800101T001',
      paymentMethod: 14,
      paymentMethodText: 'Bankgiro via Plusgiro',
      accountNumber: '11111111',
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
    },
  ],
  paymentMethods: [{ paymentCode: 14, payment: 'Bankgiro via Plusgiro', inUse: true, localNumberEnabled: false, localNumberMandatory: false }],
  paymentConcernMonths: [{ concernMonth: '202609', displayMonth: 'September 2026' }],
  balances: [
    { serviceId: 1, ownerType: 1, ownerId: 1, paymentType: 1, approvedAmount: 4.0, bookedAmount: 1.0, name: 'Ek. Bistånd 3,00 ', balanceAmount: 3.0 },
  ],
});

/** careM's utbetalning for the same payment as capture 2. */
const payment: Payment = {
  id: 'payment-1',
  amount: 1,
  paymentDate: '2026-09-21',
  applicationMonth: '2026-09',
  paymentMethod: 'Bankgiro via Plusgiro',
  payeeName: 'Kontoinnehavare A',
  clearingNumber: '',
  accountNumber: '11111111',
  payeeCity: 'Sundsvall',
  invoiceNumber: '123',
};

describe('buildPaymentCreate', () => {
  it('turns capture 1 into exactly the body of capture 2', () => {
    const create = buildPaymentCreate(underlag(), payment);

    // Capture 2 (POST Payment/Create, 2026-09-21), field for field and in order.
    const capture2 = {
      paymentId: 0,
      serviceId: 1,
      amount: 1,
      chainId: 2,
      investigationExecutionId: 2,
      paymentType: 0,
      paymentMethod: 14,
      paymentMethodText: null,
      payDate: '2026-09-21',
      concernedMonth: '202609',
      concernedMonthText: null,
      bookkeepingDate: '',
      integrationDate: '',
      cancellationDate: '',
      updateTimestamp: '',
      updateSignature: null,
      cancellationSignature: null,
      status: 0,
      statusText: null,
      error: 0,
      noIntegration: false,
      clearing: '',
      accountNumber: '11111111',
      memorialAccountNumber: null,
      name: 'Kontoinnehavare A',
      streetAddress: '',
      careOfAddress: '',
      postalCode: '',
      postalAddress: 'Sundsvall',
      billingNumber: '123',
      localNumber: '',
      ocrCheck: false,
      voucherNumber: null,
      susPersonId: '19800101T001',
      applicationText: null,
      maxAmountForPayment: 1000,
      notificationOnlyOfMaxAmountForPaymentActivated: true,
      message: BLANK_MESSAGE,
      messageRow1: '',
      messageRow2: '',
      messageRow3: '',
      messageRow4: '',
      messageRow5: '',
      messageRow6: '',
      messageRow7: '',
      balance: {
        serviceId: 1,
        ownerType: 1,
        ownerId: 1,
        paymentType: 1,
        approvedAmount: 4,
        bookedAmount: 1,
        name: 'Ek. Bistånd 3,00 ',
        balanceAmount: 3,
        id: 1,
      },
      paymentPersons: [
        {
          paymentId: 0,
          personId: '19800101T001',
          name: 'Efternamn, Förnamn',
          personKey: 0,
          included: true,
          susPerson: false,
          streetAddress: null,
          careOfAddress: null,
          postalCode: null,
          postalAddress: null,
          personIdFormatted: '800101-T001',
          personIdAndName: '800101-T001 Efternamn, Förnamn',
        },
      ],
      postings: [
        {
          paymentId: 0,
          account: 'TEST UTB',
          creditAccount: null,
          simpleAccount: '',
          amount: 1,
          simpleCreditAccount: null,
          purpose: 1,
          purposeText: 'Försörjningsstöd exklusive tillfälligt boende',
        },
      ],
      economicUnit: {
        economicalUnitId: 1,
        name: 'Ekonomiskt bistånd',
        startDate: '2026-09-01',
        endDate: '',
        giroUnit: 'IFO',
        voucherNumberIn: '0',
        voucherNumberOut: '0',
        paymentRecieverOblig: true,
      },
      serviceOrganizationText: 'Mottagning ekonomiskt bistånd',
      balanceId: 1,
      dontShowOnMyPage: false,
      maxPaymentYears: 0,
      creditAccount: '',
      simpleAccount: '',
    };
    expect(create.writable).toBe(true);
    expect(create.writable ? JSON.stringify(create.body) : '').toBe(JSON.stringify(capture2));
  });

  it('holds an utbetalning the balance does not cover — the beslut is then not in Lifecare yet', () => {
    const create = buildPaymentCreate(underlag(), { ...payment, amount: 5 });

    expect(create).toEqual({ writable: false, reason: expect.stringContaining('Saldot') as string });
  });

  it('holds an utbetalning to a payee Lifecare does not have', () => {
    const create = buildPaymentCreate(underlag(), { ...payment, accountNumber: '99999999' });

    expect(create).toEqual({ writable: false, reason: expect.stringContaining('Mottagaren') as string });
  });

  it('holds a betalsätt or a month Lifecare does not offer', () => {
    expect(buildPaymentCreate(underlag(), { ...payment, paymentMethod: 'Plusgiro' }).writable).toBe(false);
    expect(buildPaymentCreate(underlag(), { ...payment, applicationMonth: '2026-10' }).writable).toBe(false);
  });

  it('books the amount on the chosen ändamål and sends every konteringsrad, the others at 0', () => {
    // Capture 2026-09-23: Payment/Create on an insats with two konteringsrader, 1 kr on ändamål 1.
    const twoPostings = underlag();
    twoPostings.payment.postings = [
      { paymentId: 0, account: 'TEST UTB', amount: 0, purpose: 1, purposeText: 'Försörjningsstöd exklusive tillfälligt boende' },
      { paymentId: 0, account: 'TEST UTB  TVÅ', amount: 0, purpose: 3, purposeText: 'Hälso och sjukvård' },
    ];

    const create = buildPaymentCreate(twoPostings, { ...payment, accountingCode: '1' });

    expect(create.writable && create.body.postings).toEqual([
      { paymentId: 0, account: 'TEST UTB', amount: 1, purpose: 1, purposeText: 'Försörjningsstöd exklusive tillfälligt boende' },
      { paymentId: 0, account: 'TEST UTB  TVÅ', amount: 0, purpose: 3, purposeText: 'Hälso och sjukvård' },
    ]);
  });

  it('holds an utbetalning on several konteringsrader when no ändamål, or one the insats lacks, is picked', () => {
    const twoPostings = underlag();
    twoPostings.payment.postings = [
      { amount: 0, purpose: 1, purposeText: 'Försörjningsstöd exklusive tillfälligt boende' },
      { amount: 0, purpose: 3, purposeText: 'Hälso och sjukvård' },
    ];

    expect(buildPaymentCreate(twoPostings, payment).writable).toBe(false);
    expect(buildPaymentCreate(twoPostings, { ...payment, accountingCode: '9' }).writable).toBe(false);
  });

  it('holds an insats with more than one konteringsrad or balance', () => {
    const twoPostings = underlag();
    twoPostings.payment.postings = [
      { amount: 0, purpose: 1 },
      { amount: 0, purpose: 3 },
    ];
    const twoBalances = underlag();
    const [balance] = twoBalances.balances ?? [];
    twoBalances.balances = balance ? [balance, { ...balance, ownerId: 2 }] : [];

    expect(buildPaymentCreate(twoPostings, payment).writable).toBe(false);
    expect(buildPaymentCreate(twoBalances, payment).writable).toBe(false);
  });

  it('holds an amount over a blocking maximum but lets a notify-only one through', () => {
    const blocking = underlag();
    blocking.payment.maxAmountForPayment = 0.5;
    blocking.payment.notificationOnlyOfMaxAmountForPaymentActivated = false;
    const notifying = underlag();
    notifying.payment.maxAmountForPayment = 0.5;

    expect(buildPaymentCreate(blocking, payment).writable).toBe(false);
    expect(buildPaymentCreate(notifying, payment).writable).toBe(true);
  });
});
