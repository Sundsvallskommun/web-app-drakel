import CaremanagementApiService from '@services/caremanagement-api.service';
import ErrandLifecarePaymentsService from '@services/errand-lifecare-payments.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  LifecarePayee,
  LifecarePaymentOptions,
  LifecarePaymentStatus,
  LifecareRegisteredPayment,
} from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const ERRAND_ID = 'errand-1';

const accountPayee: LifecarePayee = {
  id: 2,
  label: 'Konto A',
  name: 'Kontoinnehavare A',
  paymentMethodCode: 14,
  paymentMethod: 'Bankgiro via Plusgiro',
  clearing: '',
  accountNumber: '11111111',
  streetAddress: '',
  careOfAddress: '',
  postalCode: '',
  postalAddress: 'Sundsvall',
  toRegisteredAddress: false,
};

const paymentOptions: LifecarePaymentOptions = {
  paymentMethods: [{ code: 14, name: 'Bankgiro via Plusgiro', localNumberEnabled: false, localNumberMandatory: false }],
  payees: [accountPayee],
  postings: [{ purpose: 1, text: 'Försörjningsstöd' }],
  balances: [{ name: 'Försörjningsstöd', approvedAmount: 5000, bookedAmount: 2000, balanceAmount: 3000 }],
  concernMonths: [{ month: '2026-09', label: 'September 2026' }],
  proposal: { paymentDate: '2026-09-21', concernedMonth: '2026-09', amount: 3000, payeeId: 2 },
};

const registeredPayment: LifecareRegisteredPayment = {
  id: 4,
  payDate: '2026-09-21',
  concernedMonth: '2026-09',
  amount: 3000,
  paymentMethod: 'Bankgiro via Plusgiro',
  recipient: 'Kontoinnehavare A',
  status: 'Utbetald',
  cancelled: false,
};

/** careM's answer as the transport hands it over. */
const answered = <T>(data: T, status = 200) => ({ data, message: 'success', status });

/** careM's 204: nothing there. axios leaves the body empty. */
const noContent = () => ({ data: '', message: 'success', status: 204 });

describe('ErrandLifecarePaymentsService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('paymentOptions', () => {
    it("reads the options from the errand's careM Lifecare route and passes them on", async () => {
      const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answered(paymentOptions));

      expect(await new ErrandLifecarePaymentsService().paymentOptions(ERRAND_ID)).toEqual(paymentOptions);
      expect(get).toHaveBeenCalledWith({ url: caremanagementLifecareUrl(ERRAND_ID, 'payment-options') });
    });

    it('fills in what careM left out (null or absent), so the view keeps its required fields', async () => {
      vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(
        answered({ payees: [{ id: 3, label: 'Adress', toRegisteredAddress: true }], proposal: { paymentDate: null, payeeId: 3 } }),
      );

      expect(await new ErrandLifecarePaymentsService().paymentOptions(ERRAND_ID)).toEqual({
        paymentMethods: [],
        payees: [
          {
            id: 3,
            label: 'Adress',
            name: '',
            paymentMethodCode: 0,
            paymentMethod: '',
            clearing: '',
            accountNumber: '',
            streetAddress: '',
            careOfAddress: '',
            postalCode: '',
            postalAddress: '',
            toRegisteredAddress: true,
          },
        ],
        postings: [],
        balances: [],
        concernMonths: [],
        proposal: { paymentDate: undefined, concernedMonth: undefined, amount: undefined, payeeId: 3 },
      });
    });

    it('is null when careM answers 204', async () => {
      vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(noContent());

      expect(await new ErrandLifecarePaymentsService().paymentOptions(ERRAND_ID)).toBeNull();
    });

    it("passes careM's refusal on, e.g. an errand without a Lifecare insats", async () => {
      vi.spyOn(CaremanagementApiService.prototype, 'get').mockRejectedValue(new HttpException(409, 'The errand has no Lifecare insats yet'));

      await expect(new ErrandLifecarePaymentsService().paymentOptions(ERRAND_ID)).rejects.toMatchObject({
        status: 409,
        message: 'The errand has no Lifecare insats yet',
      });
    });
  });

  describe('paymentStatus', () => {
    it("reads the status from the errand's careM Lifecare route", async () => {
      const status: LifecarePaymentStatus = {
        applicationMonth: '2026-09',
        effectuated: true,
        paymentDate: '2026-09-21',
        amount: 3000,
        status: 'Utbetald',
        unavailable: false,
      };
      const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answered(status));

      expect(await new ErrandLifecarePaymentsService().paymentStatus(ERRAND_ID)).toEqual(status);
      expect(get).toHaveBeenCalledWith({ url: caremanagementLifecareUrl(ERRAND_ID, 'payment-status') });
    });

    it("leaves out what careM wrote as null — drakel's status has those fields optional", async () => {
      vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(
        answered({ applicationMonth: '2026-09', effectuated: false, paymentDate: null, amount: null, status: null, unavailable: false }),
      );

      const status = await new ErrandLifecarePaymentsService().paymentStatus(ERRAND_ID);

      expect(status).toEqual({ applicationMonth: '2026-09', effectuated: false, unavailable: false });
      expect(status.paymentDate).toBeUndefined();
      expect(status.amount).toBeUndefined();
      expect(status.status).toBeUndefined();
    });

    it('is unavailable, not null, when careM answers 204 — callers such as the section status always get a status', async () => {
      vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(noContent());

      expect(await new ErrandLifecarePaymentsService().paymentStatus(ERRAND_ID)).toEqual({ effectuated: false, unavailable: true });
    });
  });

  describe('registeredPayments', () => {
    it("reads the utbetalningar from the errand's careM Lifecare route and passes them on in careM's order", async () => {
      const older: LifecareRegisteredPayment = { ...registeredPayment, id: 3, payDate: '2026-08-21', concernedMonth: '2026-08', cancelled: true };
      const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answered([registeredPayment, older]));

      expect(await new ErrandLifecarePaymentsService().registeredPayments(ERRAND_ID)).toEqual([registeredPayment, older]);
      expect(get).toHaveBeenCalledWith({ url: caremanagementLifecareUrl(ERRAND_ID, 'payments') });
    });

    it('fills in what careM left out', async () => {
      vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(answered([{ id: 4, payDate: null, amount: null }]));

      expect(await new ErrandLifecarePaymentsService().registeredPayments(ERRAND_ID)).toEqual([
        { id: 4, payDate: '', concernedMonth: '', amount: 0, paymentMethod: '', recipient: '', status: '', cancelled: false },
      ]);
    });

    it('is null when careM answers 204', async () => {
      vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(noContent());

      expect(await new ErrandLifecarePaymentsService().registeredPayments(ERRAND_ID)).toBeNull();
    });
  });

  describe('createPayee', () => {
    it("posts the new payee as it came to the errand's careM Lifecare route and passes careM's payee on", async () => {
      const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue(answered(accountPayee, 201));
      const newPayee = { name: 'Kontoinnehavare A', payeeName: 'Konto A', paymentMethod: 14, accountNumber: '1111-1111' };

      expect(await new ErrandLifecarePaymentsService().createPayee(ERRAND_ID, newPayee)).toEqual(accountPayee);
      expect(post).toHaveBeenCalledWith({ url: caremanagementLifecareUrl(ERRAND_ID, 'payees'), data: newPayee });
    });

    it("passes careM's refusal on", async () => {
      vi.spyOn(CaremanagementApiService.prototype, 'post').mockRejectedValue(new HttpException(502, 'Lifecare angav ingen person för insatsen'));

      await expect(new ErrandLifecarePaymentsService().createPayee(ERRAND_ID, { name: 'Någon', paymentMethod: 14 })).rejects.toMatchObject({
        status: 502,
        message: 'Lifecare angav ingen person för insatsen',
      });
    });
  });
});
