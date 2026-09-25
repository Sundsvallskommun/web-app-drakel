import CaremanagementApiService from '@services/caremanagement-api.service';
import ErrandLifecareJobStimulusService from '@services/errand-lifecare-job-stimulus.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LifecareJobStimulusPeriod, LifecareJobStimulusPeriodRoleEnum } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const JOB_STIMULUS_URL = caremanagementLifecareUrl('errand-1', 'job-stimulus-periods');

const periods: LifecareJobStimulusPeriod[] = [
  { id: 101, role: LifecareJobStimulusPeriodRoleEnum.APPLICANT, fromDate: '2026-01-01', toDate: '2027-12-31' },
  // An open period has no end.
  { id: 201, role: LifecareJobStimulusPeriodRoleEnum.CO_APPLICANT, fromDate: '2026-03-01' },
];

describe('ErrandLifecareJobStimulusService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the periods on the insats through careM, as careM answers them', async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: periods, message: 'success', status: 200 });

    expect(await new ErrandLifecareJobStimulusService().periods('errand-1')).toEqual(periods);
    expect(get).toHaveBeenCalledWith({ url: JOB_STIMULUS_URL });
  });

  it('adds a period for the sökande through careM and answers with every period', async () => {
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue({ data: periods, message: 'success', status: 201 });

    expect(await new ErrandLifecareJobStimulusService().addPeriod('errand-1', { fromDate: '2028-01-15', toDate: '2028-12-31' })).toEqual(periods);
    expect(post).toHaveBeenCalledWith({ url: JOB_STIMULUS_URL, data: { fromDate: '2028-01-15', toDate: '2028-12-31' } });
  });

  it("leaves the end to Lifecare's two-year rule when the handläggare set none", async () => {
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue({ data: periods, message: 'success', status: 201 });

    await new ErrandLifecareJobStimulusService().addPeriod('errand-1', { fromDate: '2028-01-15' });

    expect(post).toHaveBeenCalledWith({ url: JOB_STIMULUS_URL, data: { fromDate: '2028-01-15', toDate: undefined } });
  });

  it("passes careM's refusal for a household with a medsökande on", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'post').mockRejectedValue(new HttpException(422, 'Hushållet har en medsökande.'));

    await expect(new ErrandLifecareJobStimulusService().addPeriod('errand-1', { fromDate: '2028-01-15' })).rejects.toMatchObject({
      status: 422,
      message: 'Hushållet har en medsökande.',
    });
  });
});
