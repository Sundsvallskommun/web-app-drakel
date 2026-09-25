import CaremanagementApiService from '@services/caremanagement-api.service';
import LifecarePaymentRegistrationService from '@services/lifecare-payment-registration.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PaymentInputDto } from '@/dtos/payment.dto';
import { HttpException } from '@/exceptions/HttpException';

const ERRAND_ID = 'errand-1';

const input = {
  amount: 3000,
  paymentDate: '2026-09-21',
  applicationMonth: '2026-09',
  paymentMethod: 'Bankgiro via Plusgiro',
  payeeName: 'Kontoinnehavare A',
  accountNumber: '11111111',
  accountingCode: '1',
  invoiceNumber: '123',
  messageLines: ['Försörjningsstöd september'],
} satisfies PaymentInputDto;

/** careM's 201 as the transport hands it over. */
const created = (data: unknown) => ({ data, message: 'success', status: 201 });

describe('LifecarePaymentRegistrationService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the utbetalning as it came to the errand's careM Lifecare route", async () => {
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue(created({ lifecareId: '4', linkedToErrand: true }));

    await new LifecarePaymentRegistrationService().register(ERRAND_ID, input);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith({ url: caremanagementLifecareUrl(ERRAND_ID, 'payments'), data: input });
  });

  it("passes on Lifecare's id and that careM linked it to the errand", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue(created({ lifecareId: '4', linkedToErrand: true }));

    expect(await new LifecarePaymentRegistrationService().register(ERRAND_ID, input)).toEqual({ lifecareId: '4', linkedToErrand: true });
  });

  it('passes on that the utbetalning is registered in Lifecare but not linked to the errand', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue(created({ lifecareId: '4', linkedToErrand: false }));

    expect(await new LifecarePaymentRegistrationService().register(ERRAND_ID, input)).toEqual({ lifecareId: '4', linkedToErrand: false });
  });

  it('reads an answer that does not say it was linked as not linked — never an invitation to register again', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue(created({ lifecareId: '4' }));

    expect(await new LifecarePaymentRegistrationService().register(ERRAND_ID, input)).toEqual({ lifecareId: '4', linkedToErrand: false });
  });

  it.each([
    [422, 'Saldot räcker inte till beloppet.'],
    [409, 'En likadan utbetalning finns redan i Lifecare (id 4): samma belopp, månad, konto och datum.'],
    [502, 'Lifecare svarade inte. Kontrollera utbetalningarna i Lifecare innan du försöker igen.'],
  ])("passes careM's %i on in careM's words, without trying again", async (status, reason) => {
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockRejectedValue(new HttpException(status, reason));

    await expect(new LifecarePaymentRegistrationService().register(ERRAND_ID, input)).rejects.toMatchObject({ status, message: reason });
    expect(post).toHaveBeenCalledTimes(1);
  });
});
