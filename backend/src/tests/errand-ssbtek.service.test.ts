import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementSsbtekService from '@services/caremanagement-ssbtek.service';
import ErrandSsbtekService from '@services/errand-ssbtek.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ErrandSsbtekService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getErrandByIdentifier').mockResolvedValue({
      data: { id: 'errand-uuid', errandNumber: 'EB-26090036' },
      message: 'success',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads careM's SSBTEK basis for the errand behind the route segment, with the person and period asked for", async () => {
    const readBasis = vi.spyOn(CaremanagementSsbtekService.prototype, 'readBasis').mockResolvedValue({
      data: { from: '2026-07-01', to: '2026-09-30', agencies: {} },
      message: 'success',
    });

    const view = await new ErrandSsbtekService().readPayments('EB-26090036', { person: 'CO_APPLICANT' });

    expect(readBasis).toHaveBeenCalledWith('errand-uuid', { person: 'CO_APPLICANT' });
    expect(view).toEqual({ from: '2026-07-01', to: '2026-09-30', payments: [] });
  });

  it("passes on careM's refusal, e.g. an errand without a medsökande", async () => {
    vi.spyOn(CaremanagementSsbtekService.prototype, 'readBasis').mockRejectedValue(new Error('404'));

    await expect(new ErrandSsbtekService().readPayments('EB-26090036', { person: 'CO_APPLICANT' })).rejects.toThrow('404');
  });
});
