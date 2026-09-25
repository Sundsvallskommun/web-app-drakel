import CaremanagementApiService from '@services/caremanagement-api.service';
import ErrandLifecareCalculationService from '@services/errand-lifecare-calculation.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LifecareCalculationView } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const CALCULATION_URL = caremanagementLifecareUrl('errand-1', 'calculation');

/** Beräkning 31 as careM answers it, the summering already signed the way the handläggare reads it. */
const saved: LifecareCalculationView = {
  id: 31,
  normName: 'Riksnorm 2026',
  date: '2026-09-24',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  finalized: false,
  updated: '2026-09-24T10:12:00',
  summary: {
    income: 3750,
    jobStimulus: 5000,
    jobStimulusDeduction: 1250,
    norm: 3940,
    familyCost: 3940,
    commonHouseholdCost: 0,
    expenses: 5000,
    sum: -5190,
    specialExpenses: 0,
    result: -5190,
  },
};

describe('ErrandLifecareCalculationService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the beräkning saved in Lifecare through careM', async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: saved, message: 'success', status: 200 });

    expect(await new ErrandLifecareCalculationService().read('errand-1')).toEqual(saved);
    expect(get).toHaveBeenCalledWith({ url: CALCULATION_URL });
  });

  it('has none while careM answers 204 — no beräkning is saved in Lifecare yet', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: '', message: 'success', status: 204 });

    expect(await new ErrandLifecareCalculationService().read('errand-1')).toBeNull();
  });

  it("fills in what careM's view leaves out, as drakel's view requires every field", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({
      data: { id: 31, summary: { income: 3750 } },
      message: 'success',
      status: 200,
    });

    expect(await new ErrandLifecareCalculationService().read('errand-1')).toEqual({
      id: 31,
      normName: undefined,
      date: '',
      startDate: '',
      endDate: '',
      finalized: false,
      updated: '',
      summary: {
        income: 3750,
        jobStimulus: 0,
        jobStimulusDeduction: 0,
        norm: 0,
        familyCost: 0,
        commonHouseholdCost: 0,
        expenses: 0,
        sum: 0,
        specialExpenses: 0,
        result: 0,
      },
    });
  });

  it("hands careM's raw PDF on in base64", async () => {
    const pdf = new TextEncoder().encode('%PDF-1.7 beräkning');
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: pdf.buffer, message: 'success', status: 200 });

    expect(await new ErrandLifecareCalculationService().pdf('errand-1')).toBe(Buffer.from('%PDF-1.7 beräkning').toString('base64'));
    expect(get).toHaveBeenCalledWith({ url: `${CALCULATION_URL}/pdf`, responseType: 'arraybuffer' });
  });

  it('saves the beräkning in Lifecare through careM, not as slutlig unless asked', async () => {
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue({ data: saved, message: 'success', status: 200 });

    expect(await new ErrandLifecareCalculationService().save('errand-1')).toEqual(saved);
    expect(post).toHaveBeenCalledWith({ url: CALCULATION_URL, data: { finalize: false } });

    await new ErrandLifecareCalculationService().save('errand-1', true);
    expect(post).toHaveBeenLastCalledWith({ url: CALCULATION_URL, data: { finalize: true } });
  });

  it("passes careM's refusal on to the handläggare", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'post').mockRejectedValue(new HttpException(422, 'Normberäkningen saknar period.'));

    await expect(new ErrandLifecareCalculationService().save('errand-1')).rejects.toMatchObject({
      status: 422,
      message: 'Normberäkningen saknar period.',
    });
  });

  it("passes careM's 404 for the PDF of a beräkning not saved in Lifecare on", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockRejectedValue(new HttpException(404, 'Not found'));

    await expect(new ErrandLifecareCalculationService().pdf('errand-1')).rejects.toMatchObject({ status: 404 });
  });
});
