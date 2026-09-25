import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementSsbtekChangesService from '@services/caremanagement-ssbtek-changes.service';
import ErrandNormberakningService from '@services/errand-normberakning.service';
import ErrandSsbtekTransferService from '@services/errand-ssbtek-transfer.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SsbtekChangeKindEnum, SsbtekChangeRoleEnum, SsbtekChanges } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const comparison: SsbtekChanges = {
  calculationId: 48213,
  isFinal: false,
  changes: [
    { kind: SsbtekChangeKindEnum.ADD, role: SsbtekChangeRoleEnum.APPLICANT, incomeTypeId: 12, incomeType: 'Bostadsbidrag', ssbtekAmount: 4500 },
  ],
};

describe('ErrandSsbtekTransferService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementErrandService.prototype, 'getErrandByIdentifier').mockResolvedValue({
      data: { id: 'errand-uuid', errandNumber: 'EB-26090036' },
      message: 'success',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("has nothing to transfer while the normberäkning is not saved in Lifecare (careM's 404)", async () => {
    vi.spyOn(CaremanagementSsbtekChangesService.prototype, 'readChanges').mockRejectedValue(new HttpException(404, 'Not found'));

    expect(await new ErrandSsbtekTransferService().readChanges('EB-26090036')).toEqual({ available: false, isFinal: false, changes: [] });
  });

  it("writes the picked income into the normberäkning at SSBTEK's amount, then tells careM", async () => {
    vi.spyOn(CaremanagementSsbtekChangesService.prototype, 'readChanges')
      .mockResolvedValueOnce(comparison)
      .mockResolvedValueOnce({ ...comparison, changes: [] });
    const addRow = vi.spyOn(ErrandNormberakningService.prototype, 'addRow').mockResolvedValue();
    const reportApplied = vi.spyOn(CaremanagementSsbtekChangesService.prototype, 'reportApplied').mockResolvedValue();

    const after = await new ErrandSsbtekTransferService().transfer('EB-26090036', { incomes: [{ role: 'APPLICANT', incomeTypeId: 12 }] });

    expect(addRow).toHaveBeenCalledWith('errand-uuid', 'incomes', { typeId: 12, typeName: 'Bostadsbidrag', applicantCaseworkerAmount: 4500 });
    expect(reportApplied).toHaveBeenCalledWith('errand-uuid', {
      calculationId: 48213,
      applied: [{ role: 'APPLICANT', incomeType: 'Bostadsbidrag', amount: 4500 }],
    });
    expect(after.changes).toEqual([]);
  });

  it('writes nothing for an income that cannot be transferred', async () => {
    vi.spyOn(CaremanagementSsbtekChangesService.prototype, 'readChanges').mockResolvedValue(comparison);
    const addRow = vi.spyOn(ErrandNormberakningService.prototype, 'addRow').mockResolvedValue();

    await expect(
      new ErrandSsbtekTransferService().transfer('EB-26090036', { incomes: [{ role: 'CO_APPLICANT', incomeTypeId: 12 }] }),
    ).rejects.toMatchObject({ status: 409 });
    expect(addRow).not.toHaveBeenCalled();
  });

  it('refuses a transfer while the normberäkning is not saved in Lifecare', async () => {
    vi.spyOn(CaremanagementSsbtekChangesService.prototype, 'readChanges').mockRejectedValue(new HttpException(404, 'Not found'));

    await expect(
      new ErrandSsbtekTransferService().transfer('EB-26090036', { incomes: [{ role: 'APPLICANT', incomeTypeId: 12 }] }),
    ).rejects.toMatchObject({ status: 409, message: expect.stringContaining('sparad i Lifecare') as unknown });
  });

  it('keeps the transfer when careM could not be told — the income is in the normberäkning either way', async () => {
    vi.spyOn(CaremanagementSsbtekChangesService.prototype, 'readChanges').mockResolvedValue(comparison);
    vi.spyOn(ErrandNormberakningService.prototype, 'addRow').mockResolvedValue();
    vi.spyOn(CaremanagementSsbtekChangesService.prototype, 'reportApplied').mockRejectedValue(new HttpException(502, 'careM svarade inte'));

    await expect(
      new ErrandSsbtekTransferService().transfer('EB-26090036', { incomes: [{ role: 'APPLICANT', incomeTypeId: 12 }] }),
    ).resolves.toMatchObject({ available: true });
  });
});
