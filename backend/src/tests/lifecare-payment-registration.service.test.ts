import { LifecarePaymentForCreateRaw } from '@interfaces/lifecare-payment.interface';
import CaremanagementEventService from '@services/caremanagement-event.service';
import CaremanagementPaymentService from '@services/caremanagement-payment.service';
import LifecarePaymentRegistrationService from '@services/lifecare-payment-registration.service';
import LifecarePaymentsService from '@services/lifecare-payments.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Payment, PaymentStatusEnum } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const pending: Payment = {
  id: 'payment-1',
  status: PaymentStatusEnum.PENDING_REGISTRATION,
  amount: 1,
  paymentDate: '2026-09-21',
  applicationMonth: '2026-09',
  paymentMethod: 'Bankgiro via Plusgiro',
  payeeName: 'Kontoinnehavare A',
  accountNumber: '11111111',
  invoiceNumber: '123',
};

const underlag: LifecarePaymentForCreateRaw = {
  payment: { paymentId: 0, postings: [{ amount: 0, purpose: 1 }], paymentPersons: [] },
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
  let report: ReturnType<typeof vi.spyOn<CaremanagementPaymentService, 'reportLifecareResult'>>;

  beforeEach(() => {
    vi.spyOn(CaremanagementPaymentService.prototype, 'readPayment').mockResolvedValue({ data: pending, message: 'success' });
    vi.spyOn(LifecarePaymentsService.prototype, 'readPaymentForCreate').mockResolvedValue(underlag);
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
    report = vi.spyOn(CaremanagementPaymentService.prototype, 'reportLifecareResult').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers the utbetalning and receipts the Lifecare id to careM', async () => {
    vi.spyOn(LifecarePaymentsService.prototype, 'createPayment').mockResolvedValue({ paymentId: 4 });

    const registration = await new LifecarePaymentRegistrationService().register('errand-1', 1, 'payment-1');

    expect(registration).toEqual({ paymentId: 'payment-1', outcome: 'REGISTERED', lifecareId: '4' });
    expect(report).toHaveBeenCalledWith('errand-1', 'payment-1', { outcome: 'REGISTERED', lifecarePaymentId: '4' });
  });

  it('leaves an utbetalning careM already has as registered alone', async () => {
    vi.spyOn(CaremanagementPaymentService.prototype, 'readPayment').mockResolvedValue({
      data: { ...pending, status: PaymentStatusEnum.REGISTERED, lifecareId: '4' },
      message: 'success',
    });
    const create = vi.spyOn(LifecarePaymentsService.prototype, 'createPayment');

    const registration = await new LifecarePaymentRegistrationService().register('errand-1', 1, 'payment-1');

    expect(registration.outcome).toBe('REGISTERED');
    expect(create).not.toHaveBeenCalled();
  });

  it('does not send one it cannot vouch for, and tells careM nothing', async () => {
    vi.spyOn(CaremanagementPaymentService.prototype, 'readPayment').mockResolvedValue({ data: { ...pending, amount: 50 }, message: 'success' });
    const create = vi.spyOn(LifecarePaymentsService.prototype, 'createPayment');

    const registration = await new LifecarePaymentRegistrationService().register('errand-1', 1, 'payment-1');

    expect(registration.outcome).toBe('NOT_SENT');
    expect(create).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
  });

  it('reports a refusal from Lifecare as FAILED with its reason', async () => {
    vi.spyOn(LifecarePaymentsService.prototype, 'createPayment').mockRejectedValue(new HttpException(422, 'Lifecare godtog inte uppgifterna.'));

    const registration = await new LifecarePaymentRegistrationService().register('errand-1', 1, 'payment-1');

    expect(registration.outcome).toBe('FAILED');
    expect(report).toHaveBeenCalledWith('errand-1', 'payment-1', { outcome: 'FAILED', detail: 'Lifecare godtog inte uppgifterna.' });
  });

  it('reports nothing when Lifecare did not answer, since whether it paid is unknown', async () => {
    vi.spyOn(LifecarePaymentsService.prototype, 'createPayment').mockRejectedValue(
      new HttpException(502, 'Lifecare could not be reached (ETIMEDOUT)'),
    );

    const registration = await new LifecarePaymentRegistrationService().register('errand-1', 1, 'payment-1');

    expect(registration.outcome).toBe('NOT_SENT');
    expect(report).not.toHaveBeenCalled();
  });

  it('warns not to register again when careM never takes the receipt', async () => {
    vi.spyOn(LifecarePaymentsService.prototype, 'createPayment').mockResolvedValue({ paymentId: 4 });
    report.mockRejectedValue(new HttpException(500, 'down'));

    const registration = await new LifecarePaymentRegistrationService().register('errand-1', 1, 'payment-1');

    expect(registration.outcome).toBe('REGISTERED');
    expect(registration.detail).toContain('Registrera den inte igen');
    expect(report).toHaveBeenCalledTimes(3);
  });
});
