import CaremanagementApiService from '@services/caremanagement-api.service';
import ErrandNormberakningService from '@services/errand-normberakning.service';
import { caremanagementLifecareUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { NormberakningDraft, NormberakningDraftSourceEnum, NormberakningPersonRowRoleEnum } from '@/data-contracts/caremanagement/data-contracts';
import { HttpException } from '@/exceptions/HttpException';

const NORMBERAKNING_URL = caremanagementLifecareUrl('errand-1', 'normberakning');

/** careM's rows for a beräkning saved in Lifecare. */
const lifecareDraft: NormberakningDraft = {
  normId: 1,
  calculationFromDate: '2026-09-01',
  calculationToDate: '2026-09-30',
  hasCustomHouseholdSize: true,
  householdSize: 4,
  persons: [{ id: '1', name: 'Testsson, Test', personalNumber: '198802092385', role: NormberakningPersonRowRoleEnum.APPLICANT, normRowId: 2 }],
  incomes: [{ id: '1', typeName: 'Lön efter skatt', applicantCaseworkerAmount: 5000, applicantJobStimulus: true, applicantCountedAmount: 3750 }],
  expenses: [{ id: 'E-3', costType: '3', costTypeDisplayName: 'Boendekostnad', caseworkerAmount: 5000 }],
  source: NormberakningDraftSourceEnum.LIFECARE,
  finalized: false,
  normRows: [{ id: 2, name: 'Ensamstående 3940.00' }, { name: 'Utan id' }],
};

const careMAnswers = (data: unknown) => ({ data, message: 'success', status: 200 });
const careMHasNoContent = () => ({ data: '', message: 'success', status: 204 });

describe('ErrandNormberakningService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the Normberäkning tab's rows from careM, which decides between its draft and Lifecare", async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(careMAnswers(lifecareDraft));

    const draft = await new ErrandNormberakningService().readDraft('errand-1');

    expect(get).toHaveBeenCalledWith({ url: NORMBERAKNING_URL });
    expect(draft).toEqual({
      ...lifecareDraft,
      // A normintervall the Normintervall list could not offer (no id) is left out.
      normRows: [{ id: 2, name: 'Ensamstående 3940.00' }],
    });
  });

  it("tells finalize whether the household has an own size, from careM's rows", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(careMAnswers(lifecareDraft));
    expect(await new ErrandNormberakningService().householdSizeChanged('errand-1')).toBe(true);

    vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue(careMAnswers({ source: NormberakningDraftSourceEnum.CAREM }));
    expect(await new ErrandNormberakningService().householdSizeChanged('errand-1')).toBe(false);
  });

  it('reads the type catalogues from careM, a catalogue careM leaves out being empty', async () => {
    const get = vi
      .spyOn(CaremanagementApiService.prototype, 'get')
      .mockResolvedValue(
        careMAnswers({ norms: [{ code: '1', displayName: 'Riksnorm 2026' }], incomeTypes: [{ code: '1', displayName: 'Lön efter skatt' }] }),
      );

    expect(await new ErrandNormberakningService().types('errand-1')).toEqual({
      norms: [{ code: '1', displayName: 'Riksnorm 2026' }],
      incomeTypes: [{ code: '1', displayName: 'Lön efter skatt' }],
      costTypes: [],
      livingCostTypes: [],
    });
    expect(get).toHaveBeenCalledWith({ url: `${NORMBERAKNING_URL}/types` });
  });

  it('changes the header in careM', async () => {
    const patch = vi.spyOn(CaremanagementApiService.prototype, 'patch').mockResolvedValue(careMHasNoContent());

    await new ErrandNormberakningService().updateHeader('errand-1', { hasCustomHouseholdSize: true, householdSize: 4 });

    expect(patch).toHaveBeenCalledWith({ url: `${NORMBERAKNING_URL}/header`, data: { hasCustomHouseholdSize: true, householdSize: 4 } });
  });

  it('adds a row to a section in careM', async () => {
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue(careMHasNoContent());

    await new ErrandNormberakningService().addRow('errand-1', 'incomes', { typeName: 'Lön', applicantCaseworkerAmount: 100 });

    expect(post).toHaveBeenCalledWith({ url: `${NORMBERAKNING_URL}/incomes`, data: { typeName: 'Lön', applicantCaseworkerAmount: 100 } });
  });

  it("sets the handläggare's values on a row in careM", async () => {
    const patch = vi.spyOn(CaremanagementApiService.prototype, 'patch').mockResolvedValue(careMHasNoContent());

    await new ErrandNormberakningService().updateRow('errand-1', 'expenses', 'E-3', { appliedAmount: 5000, caseworkerAmount: 4500 });

    expect(patch).toHaveBeenCalledWith({ url: `${NORMBERAKNING_URL}/expenses/E-3`, data: { appliedAmount: 5000, caseworkerAmount: 4500 } });
  });

  it('removes a row in careM', async () => {
    const remove = vi.spyOn(CaremanagementApiService.prototype, 'delete').mockResolvedValue(careMHasNoContent());

    await new ErrandNormberakningService().deleteRow('errand-1', 'incomes', 'row-1');

    expect(remove).toHaveBeenCalledWith({ url: `${NORMBERAKNING_URL}/incomes/row-1` });
  });

  it("restores a soft-deleted row of careM's draft", async () => {
    const post = vi.spyOn(CaremanagementApiService.prototype, 'post').mockResolvedValue(careMHasNoContent());

    await new ErrandNormberakningService().restoreRow('errand-1', 'persons', 'row-1');

    expect(post).toHaveBeenCalledWith({ url: `${NORMBERAKNING_URL}/persons/row-1/restore` });
  });

  it("passes careM's refusal on to the handläggare", async () => {
    vi.spyOn(CaremanagementApiService.prototype, 'post').mockRejectedValue(new HttpException(422, 'Personer läggs till i hushållet i Lifecare.'));

    await expect(new ErrandNormberakningService().addRow('errand-1', 'persons', { name: 'Ny person' })).rejects.toMatchObject({
      status: 422,
      message: 'Personer läggs till i hushållet i Lifecare.',
    });
  });
});
