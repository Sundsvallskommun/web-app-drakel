import { LifecarePayeeRaw, LifecarePaymentForCreateRaw, LifecareRegisteredPaymentRaw } from '@interfaces/lifecare-payment.interface';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import ErrandLifecarePaymentsService from '@services/errand-lifecare-payments.service';
import LifecarePaymentsService from '@services/lifecare-payments.service';
import { ADDRESS_PAYEE_ID } from '@utils/lifecare-payee';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const accountPayee: LifecarePayeeRaw = {
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
};

const underlag: LifecarePaymentForCreateRaw = {
  payment: { paymentId: 0, susPersonId: '19800101T001' },
  payees: [
    { ...accountPayee, payeeId: ADDRESS_PAYEE_ID, payeeName: 'Adress', paymentMethod: 0, paymentMethodText: null, accountNumber: '' },
    accountPayee,
    { ...accountPayee, payeeId: 9, isActive: false },
  ],
  paymentMethods: [
    { paymentCode: 14, payment: 'Bankgiro via Plusgiro', inUse: true, localNumberEnabled: false, localNumberMandatory: false },
    { paymentCode: 21, payment: 'Memorial', inUse: false, localNumberEnabled: false, localNumberMandatory: false },
  ],
};

// The insats's utbetalningar in Lifecare: the latest standing one went to Konto A.
const registered: LifecareRegisteredPaymentRaw[] = [
  { paymentId: 4, amount: 1, payDate: '2026-09-21', concernedMonth: '202609', accountNumber: '11111111', cancellationDate: '' },
  { paymentId: 5, amount: 2, payDate: '2026-09-22', concernedMonth: '202609', accountNumber: '22222222', cancellationDate: '2026-09-22' },
];

describe('ErrandLifecarePaymentsService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
      data: { lifecareServiceId: 1 },
      message: 'success',
    });
    vi.spyOn(LifecarePaymentsService.prototype, 'readPaymentForCreate').mockResolvedValue(underlag);
    vi.spyOn(LifecarePaymentsService.prototype, 'readLatestPayments').mockResolvedValue(registered);
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the betalsätt in use and the active payees, without the personnummer', async () => {
    const options = await new ErrandLifecarePaymentsService().paymentOptions('errand-1');

    expect(options.paymentMethods.map(method => method.code)).toEqual([14]);
    expect(options.payees.map(payee => payee.id)).toEqual([ADDRESS_PAYEE_ID, 2]);
    expect(options.payees[0]?.toRegisteredAddress).toBe(true);
    expect(JSON.stringify(options)).not.toContain('19800101T001');
  });

  it('proposes the next utbetalning from Lifecare alone: its date and month, what is left, the last payee', async () => {
    const withSaldo: LifecarePaymentForCreateRaw = {
      ...underlag,
      payment: { ...underlag.payment, payDate: '2026-09-23' },
      paymentConcernMonths: [{ concernMonth: '202609', displayMonth: 'September 2026' }],
      balances: [
        { serviceId: 1, ownerType: 1, ownerId: 1, paymentType: 1, approvedAmount: 5, bookedAmount: 2, name: 'Ek. Bistånd 3,00 ', balanceAmount: 3 },
      ],
    };
    vi.spyOn(LifecarePaymentsService.prototype, 'readPaymentForCreate').mockResolvedValue(withSaldo);

    const options = await new ErrandLifecarePaymentsService().paymentOptions('errand-1');

    // The makulerad utbetalning to Konto B is newer but no longer stands, so Konto A is proposed.
    expect(options.proposal).toEqual({ paymentDate: '2026-09-23', concernedMonth: '2026-09', amount: 3, payeeId: 2 });
    expect(options.concernMonths).toEqual([{ month: '2026-09', label: 'September 2026' }]);
    expect(options.balances).toEqual([{ name: 'Ek. Bistånd 3,00', approvedAmount: 5, bookedAmount: 2, balanceAmount: 3 }]);
  });

  it('reads the utbetalning status for the ansökningsmånad from Lifecare', async () => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
      data: { lifecareServiceId: 1, data: { periodMonth: 9, periodYear: 2026 } },
      message: 'success',
    });

    const status = await new ErrandLifecarePaymentsService().paymentStatus('errand-1');

    expect(status).toEqual({ applicationMonth: '2026-09', effectuated: true, paymentDate: '2026-09-21', unavailable: false });
  });

  it('reports the status as unavailable when Lifecare cannot be read', async () => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
      data: { lifecareServiceId: 1, data: { periodMonth: 9, periodYear: 2026 } },
      message: 'success',
    });
    vi.spyOn(LifecarePaymentsService.prototype, 'readLatestPayments').mockRejectedValue(new Error('Lifecare could not be reached'));

    const status = await new ErrandLifecarePaymentsService().paymentStatus('errand-1');

    expect(status).toEqual({ applicationMonth: '2026-09', effectuated: false, unavailable: true });
  });

  it('files a new payee under the person Lifecare names for the insats', async () => {
    const create = vi
      .spyOn(LifecarePaymentsService.prototype, 'createPayee')
      .mockResolvedValue({ ...accountPayee, payeeId: 3, payeeName: 'Konto B', accountNumber: '22222222' });

    const created = await new ErrandLifecarePaymentsService().createPayee('errand-1', {
      name: 'Kontoinnehavare B',
      paymentMethod: 14,
      accountNumber: '22222222',
    });

    expect(create.mock.calls[0]?.[0]).toMatchObject({ personId: '19800101T001', paymentMethod: 14, accountNumber: '22222222' });
    expect(created.id).toBe(3);
  });

  it('returns the existing payee instead of creating the same one twice', async () => {
    const create = vi.spyOn(LifecarePaymentsService.prototype, 'createPayee');

    const payee = await new ErrandLifecarePaymentsService().createPayee('errand-1', { name: 'Någon', paymentMethod: 14, accountNumber: '1111-1111' });

    expect(payee.id).toBe(2);
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses a betalsätt the insats does not offer', async () => {
    await expect(
      new ErrandLifecarePaymentsService().createPayee('errand-1', { name: 'Någon', paymentMethod: 21, accountNumber: '1' }),
    ).rejects.toMatchObject({
      status: 400,
    });
  });
});
