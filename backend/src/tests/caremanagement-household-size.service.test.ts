import CaremanagementApiService from '@services/caremanagement-api.service';
import CaremanagementHouseholdSizeService from '@services/caremanagement-household-size.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NormberakningDraftSourceEnum } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

describe('CaremanagementHouseholdSizeService.readHouseholdSizeChanged', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [NormberakningDraftSourceEnum.CAREM, true],
    [NormberakningDraftSourceEnum.LIFECARE, true],
    [NormberakningDraftSourceEnum.LIFECARE, false],
  ])("reads the flag from careM's normberäkning (%s: %s)", async (source, hasCustomHouseholdSize) => {
    const get = vi
      .spyOn(CaremanagementApiService.prototype, 'get')
      .mockResolvedValue({ data: { source, hasCustomHouseholdSize }, message: 'success', status: 200 });

    expect(await new CaremanagementHouseholdSizeService().readHouseholdSizeChanged('errand-1')).toBe(hasCustomHouseholdSize);
    expect(get).toHaveBeenCalledWith({ url: caremanagementLifecareUrl('errand-1', 'normberakning') });
  });

  it('reads an unchanged size when careM does not say', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({ data: {}, message: 'success', status: 200 });

    expect(await new CaremanagementHouseholdSizeService().readHouseholdSizeChanged('errand-1')).toBe(false);
  });

  it('reads an unchanged size when the errand has no normberäkning', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockRejectedValue(new HttpException(404, 'Not found'));

    expect(await new CaremanagementHouseholdSizeService().readHouseholdSizeChanged('errand-1')).toBe(false);
  });

  it('lets any other failure through', async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockRejectedValue(new HttpException(502, 'Lifecare could not be read'));

    await expect(new CaremanagementHouseholdSizeService().readHouseholdSizeChanged('errand-1')).rejects.toMatchObject({ status: 502 });
  });
});
