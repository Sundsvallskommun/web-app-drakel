import CaremanagementApiService from '@services/caremanagement-api.service';
import ErrandPreviousCalculationService from '@services/errand-previous-calculation.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NormberakningPreviousCalculation } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const PREVIOUS_URL = caremanagementLifecareUrl('errand-1', 'normberakning', 'previous');

/** Beräkning 29, the one before the errand's own period. */
const previous: NormberakningPreviousCalculation = {
  id: 29,
  norm: 'Riksnorm 2026',
  fromDate: '2026-08-01',
  toDate: '2026-08-31',
  incomeSum: 3750,
  expenseSum: 5000,
  normSum: 3940,
  balance: -5190,
  isFinal: true,
  persons: [{ name: 'Testsson, Test', amount: 3940 }],
  incomes: [{ type: 'Lön efter skatt', amountApplicant: 3750 }],
  expenses: [{ type: 'Boendekostnad', appliedAmount: 5000, approvedAmount: 5000 }],
  specialExpenses: [],
};

describe('ErrandPreviousCalculationService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the previous beräkning through careM, as careM answers it', async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: previous, message: 'success', status: 200 });

    expect(await new ErrandPreviousCalculationService().read('errand-1')).toEqual(previous);
    expect(get).toHaveBeenCalledWith({ url: PREVIOUS_URL });
  });

  it("has none when careM answers 204 — the insats has no beräkning before the errand's period", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: '', message: 'success', status: 204 });

    expect(await new ErrandPreviousCalculationService().read('errand-1')).toBeNull();
  });

  it("passes careM's refusal on to the handläggare", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockRejectedValue(new HttpException(502, 'Lifecare svarade inte.'));

    await expect(new ErrandPreviousCalculationService().read('errand-1')).rejects.toMatchObject({ status: 502, message: 'Lifecare svarade inte.' });
  });
});
