import { LifecarePaymentForCreateRaw, LifecareRegisteredPaymentRaw } from '@interfaces/lifecare-payment.interface';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import LifecarePaymentRegistrationService from '@services/lifecare-payment-registration.service';
import LifecarePaymentsService from '@services/lifecare-payments.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PaymentInputDto } from '@/dtos/payment.dto';
import { HttpException } from '@/exceptions/HttpException';

const input = {
  amount: 1,
  paymentDate: '2026-09-21',
  applicationMonth: '2026-09',
  paymentMethod: 'Bankgiro via Plusgiro',
  payeeName: 'Kontoinnehavare A',
  accountNumber: '11111111',
  invoiceNumber: '123',
} satisfies PaymentInputDto;

const underlag: LifecarePaymentForCreateRaw = {
  payment: {
    paymentId: 0,
    payDate: '2026-09-21',
    susPersonId: '19800101T001',
    postings: [{ amount: 0, purpose: 1, purposeText: 'Försörjningsstöd exklusive tillfälligt boende' }],
    paymentPersons: [],
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
      postalAddress: '',
      ocrCheck: false,
      addressFromPerson: false,
      updateTimestamp: '',
      updateSignature: null,
      isActive: true,
      statusText: null,
    },
  ],
  paymentMethods: [{ paymentCode: 14, payment: 'Bankgiro via Plusgiro', inUse: true, localNumberEnabled: false, localNumberMandatory: false }],
  paymentConcernMonths: [{ concernMonth: '202609', displayMonth: 'September 2026' }],
  balances: [{ serviceId: 1, ownerType: 1, ownerId: 1, paymentType: 1, approvedAmount: 4, bookedAmount: 1, name: 'Ek. Bistånd', balanceAmount: 3 }],
};

describe('LifecarePaymentRegistrationService', () => {
  let link: ReturnType<typeof vi.spyOn<CaremanagementErrandService, 'addLifecarePaymentId'>>;
  const existing: LifecareRegisteredPaymentRaw = {
    paymentId: 4,
    amount: 1,
    payDate: '2026-09-21',
    concernedMonth: '202609',
    accountNumber: '11111111',
    cancellationDate: '',
  };

  beforeEach(() => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
      data: { lifecareServiceId: 1 },
      message: 'success',
    });
    vi.spyOn(LifecarePaymentsService.prototype, 'readPaymentForCreate').mockResolvedValue(underlag);
    vi.spyOn(LifecarePaymentsService.prototype, 'readLatestPayments').mockResolvedValue([]);
    vi.spyOn(LifecarePaymentsService.prototype, 'hasHouseholdOn').mockResolvedValue(true);
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
    link = vi.spyOn(CaremanagementErrandService.prototype, 'addLifecarePaymentId').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers the utbetalning in Lifecare and answers with its id', async () => {
    const create = vi.spyOn(LifecarePaymentsService.prototype, 'createPayment').mockResolvedValue({ paymentId: 4 });

    const created = await new LifecarePaymentRegistrationService().register('errand-1', input);

    expect(created).toEqual({ lifecareId: '4' });
    // careM is pointed at the utbetalning, so it finds a bifall's utbetalning by id.
    expect(link).toHaveBeenCalledWith('errand-1', '4');
    expect(create.mock.calls[0]?.[0]).toBe(1);
    expect(create.mock.calls[0]?.[1]).toMatchObject({ amount: 1, concernedMonth: '202609', billingNumber: '123' });
  });

  it('refuses an utbetalning Lifecare already holds instead of paying it twice', async () => {
    vi.spyOn(LifecarePaymentsService.prototype, 'readLatestPayments').mockResolvedValue([existing]);
    const create = vi.spyOn(LifecarePaymentsService.prototype, 'createPayment');

    await expect(new LifecarePaymentRegistrationService().register('errand-1', input)).rejects.toMatchObject({ status: 409 });
    expect(create).not.toHaveBeenCalled();
  });

  it('does not take a makulerad or different utbetalning for the same one', async () => {
    vi.spyOn(LifecarePaymentsService.prototype, 'readLatestPayments').mockResolvedValue([
      { ...existing, cancellationDate: '2026-09-22' },
      { ...existing, paymentId: 5, amount: 2 },
      { ...existing, paymentId: 6, payDate: '2026-09-08' },
    ]);
    vi.spyOn(LifecarePaymentsService.prototype, 'createPayment').mockResolvedValue({ paymentId: 7 });

    expect(await new LifecarePaymentRegistrationService().register('errand-1', input)).toEqual({ lifecareId: '7' });
  });

  it('does not send an utbetalning for a person Lifecare has no hushåll for on the payment date', async () => {
    vi.spyOn(LifecarePaymentsService.prototype, 'hasHouseholdOn').mockResolvedValue(false);
    const create = vi.spyOn(LifecarePaymentsService.prototype, 'createPayment');

    await expect(new LifecarePaymentRegistrationService().register('errand-1', input)).rejects.toMatchObject({ status: 422 });
    expect(create).not.toHaveBeenCalled();
  });

  it('does not send one it cannot vouch for, and says why', async () => {
    const create = vi.spyOn(LifecarePaymentsService.prototype, 'createPayment');

    await expect(new LifecarePaymentRegistrationService().register('errand-1', { ...input, amount: 50 })).rejects.toMatchObject({
      status: 422,
      message: expect.stringContaining('räcker inte') as string,
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("passes a refusal from Lifecare on in Lifecare's words", async () => {
    vi.spyOn(LifecarePaymentsService.prototype, 'createPayment').mockRejectedValue(new HttpException(422, 'Lifecare godtog inte uppgifterna.'));

    await expect(new LifecarePaymentRegistrationService().register('errand-1', input)).rejects.toMatchObject({
      status: 422,
      message: 'Lifecare godtog inte uppgifterna.',
    });
  });

  it('keeps the registration when careM cannot be pointed at the utbetalning', async () => {
    vi.spyOn(LifecarePaymentsService.prototype, 'createPayment').mockResolvedValue({ paymentId: 4 });
    link.mockRejectedValue(new HttpException(500, 'down'));

    expect(await new LifecarePaymentRegistrationService().register('errand-1', input)).toEqual({ lifecareId: '4' });
    expect(link).toHaveBeenCalledTimes(3);
  });

  it('says to check Lifecare when it did not answer, since whether it paid is unknown', async () => {
    vi.spyOn(LifecarePaymentsService.prototype, 'createPayment').mockRejectedValue(
      new HttpException(502, 'Lifecare could not be reached (ETIMEDOUT)'),
    );

    await expect(new LifecarePaymentRegistrationService().register('errand-1', input)).rejects.toMatchObject({
      status: 502,
      message: expect.stringContaining('Kontrollera') as string,
    });
  });
});
