import { LifecarePaymentsController } from '@controllers/lifecare-payments.controller';
import CaremanagementApiService from '@services/caremanagement-api.service';
import { afterEach, describe, expect, it, vi } from 'vitest';

const ERRAND_ID = 'errand-1';

/** careM's 204: nothing there. axios leaves the body empty. */
const noContent = () => ({ data: '', message: 'success', status: 204 });

// careM answers bare; drakel keeps its own `{ data, message }` envelope, with `data: null` for careM's 204.
describe('LifecarePaymentsController', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("wraps careM's utbetalningar in drakel's envelope", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: [], message: 'success', status: 200 });

    expect(await new LifecarePaymentsController().registeredPayments(ERRAND_ID)).toEqual({ data: [], message: 'success' });
  });

  it("answers data: null for careM's 204 on the payment options", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(noContent());

    expect(await new LifecarePaymentsController().paymentOptions(ERRAND_ID)).toEqual({ data: null, message: 'success' });
  });

  it("answers data: null for careM's 204 on the utbetalningar", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(noContent());

    expect(await new LifecarePaymentsController().registeredPayments(ERRAND_ID)).toEqual({ data: null, message: 'success' });
  });

  it('wraps the registered utbetalning, linkedToErrand included', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue({
      data: { lifecareId: '4', linkedToErrand: false },
      message: 'success',
      status: 201,
    });

    expect(await new LifecarePaymentsController().registerPayment(ERRAND_ID, { amount: 3000 })).toEqual({
      data: { lifecareId: '4', linkedToErrand: false },
      message: 'success',
    });
  });
});
