import CaremanagementApiService from '@services/caremanagement-api.service';
import ErrandLifecareSectionStatusService from '@services/errand-lifecare-section-status.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HttpException } from '@/exceptions/HttpException';

describe('ErrandLifecareSectionStatusService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the tabs' checks from careM", async () => {
    const status = { calculationFinalized: true, decisionSaved: false, paymentRegistered: true };
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: status, message: 'success', status: 200 });

    expect(await new ErrandLifecareSectionStatusService().read('errand-1')).toEqual(status);
    expect(get).toHaveBeenCalledWith({ url: caremanagementLifecareUrl('errand-1', 'section-status') });
  });

  it('leaves a check careM does not answer unchecked', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: { decisionSaved: true }, message: 'success', status: 200 });

    expect(await new ErrandLifecareSectionStatusService().read('errand-1')).toEqual({
      calculationFinalized: false,
      decisionSaved: true,
      paymentRegistered: false,
    });
  });

  it("passes on careM's refusal of an errand it does not have", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockRejectedValue(new HttpException(404, 'Not found'));

    await expect(new ErrandLifecareSectionStatusService().read('errand-1')).rejects.toMatchObject({ status: 404 });
  });
});
