import { LifecareCalculationForEditRaw, LifecareCalculationRaw } from '@interfaces/lifecare-calculation.interface';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import ErrandNormberakningService from '@services/errand-normberakning.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import LifecareJobStimulusService from '@services/lifecare-job-stimulus.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Beräkning 30 as read for edit: "Lön efter skatt" 5 000 gross, counted 3 750 with 25 % jobbstimulans. */
const saved: LifecareCalculationRaw = {
  calculationId: 30,
  normId: 1,
  normText: 'Riksnorm 2026',
  date: '2026-09-24',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  calculationSummary: null,
  calculationPersons: [
    {
      personId: '19880209T050',
      personKey: 1,
      name: 'Testsson, Test',
      normRowId: 2,
      normRow: 'Ensamstående',
      amount: 3940,
      included: true,
      deviationFromDate: '',
      deviationToDate: '',
      personIdFormatted: '880209-T050',
    },
  ],
  calculationIncomes: [
    {
      incomeCode: 1,
      incomeType: 'Lön efter skatt',
      amountApplicant: 3750,
      grossAmountApplicant: 5000,
      amountCoApplicant: 0,
    },
  ],
  calculationExpenses: [{ expenseCode: 3, expenseType: 'Boendekostnad', appliedAmount: 5000, approvedAmount: 5000, note: '' }],
  calculationSpecialExpenses: [],
  hasCustomHouseholdSize: false,
  isFinalized: false,
  updateTimestamp: '2026-09-24',
  hasApplicantJobStimuli: true,
};

const forEdit = (calculation: LifecareCalculationRaw = saved): LifecareCalculationForEditRaw => ({
  calculation,
  norms: [{ normId: 1, name: 'Riksnorm 2026' }],
  incomeTypes: [{ id: 1, text: 'Lön efter skatt', isActive: true, isJobStimulus: true, jobStimulusPercent: 25 }],
  expenseTypes: [{ id: 3, text: 'Boendekostnad', isActive: true }],
  specialExpenseTypes: [],
});

const withCalculationId = (lifecareCalculationId?: number) =>
  vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
    data: { lifecareServiceId: 1, data: { lifecareCalculationId, periodMonth: 9, periodYear: 2026 } },
    message: 'success',
  });

describe('ErrandNormberakningService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
    vi.spyOn(LifecareJobStimulusService.prototype, 'readForService').mockResolvedValue({ applicant: null, coApplicant: null, hasCoApplicant: false });
    // Lifecare places the member where it was and finds jobbstimulans in the period.
    vi.spyOn(LifecareCalculationsService.prototype, 'placePersons').mockResolvedValue({ calculationPersons: saved.calculationPersons });
    vi.spyOn(LifecareCalculationsService.prototype, 'withJobStimuli').mockImplementation(calculation =>
      Promise.resolve({ ...(calculation as LifecareCalculationRaw), hasApplicantJobStimuli: true }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows careM's draft until the beräkning is saved in Lifecare", async () => {
    withCalculationId(undefined);
    vi.spyOn(CaremanagementNormberakningService.prototype, 'readDraft').mockResolvedValue({ data: { normId: 1 }, message: 'success' });

    expect(await new ErrandNormberakningService().readDraft('errand-1')).toEqual({ normId: 1, source: 'CAREM' });
  });

  it("shows Lifecare's beräkning once it is saved there", async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue(forEdit());

    const draft = await new ErrandNormberakningService().readDraft('errand-1');

    expect(draft).toMatchObject({ source: 'LIFECARE', applicationMonth: '2026-09' });
    expect(draft.incomes?.[0]?.applicantCaseworkerAmount).toBe(5000);
  });

  it('adds a row in careM before the beräkning is saved in Lifecare', async () => {
    withCalculationId(undefined);
    const addRow = vi.spyOn(CaremanagementNormberakningService.prototype, 'addRow').mockResolvedValue({ data: {}, message: 'success' });
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update');

    await new ErrandNormberakningService().addRow('errand-1', 'incomes', { typeName: 'Lön', applicantCaseworkerAmount: 100 });

    expect(addRow).toHaveBeenCalledWith('errand-1', 'incomes', { typeName: 'Lön', applicantCaseworkerAmount: 100 });
    expect(update).not.toHaveBeenCalled();
  });

  it('changes a row in Lifecare once saved there, counting jobbstimulans from the gross only once', async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue(forEdit());
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue(saved);
    const addRow = vi.spyOn(CaremanagementNormberakningService.prototype, 'addRow');

    await new ErrandNormberakningService().updateRow('errand-1', 'expenses', 'E-3', { appliedAmount: 5000, caseworkerAmount: 4500 });

    const body = update.mock.calls[0]?.[1] as {
      calculationExpenses: { approvedAmount: number }[];
      calculationIncomes: { amountApplicant: number; grossAmountApplicant: number }[];
    };
    expect(update.mock.calls[0]?.[0]).toBe(30);
    expect(body.calculationExpenses[0]?.approvedAmount).toBe(4500);
    // The untouched income stays 3 750 counted from 5 000 gross — not 25 % off 3 750 again.
    expect(body.calculationIncomes[0]).toMatchObject({ amountApplicant: 3750, grossAmountApplicant: 5000 });
    expect(addRow).not.toHaveBeenCalled();
  });

  it('refuses any change to a beräkning Lifecare holds as slutlig', async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue(forEdit({ ...saved, isFinalized: true }));
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update');

    await expect(new ErrandNormberakningService().deleteRow('errand-1', 'incomes', '1')).rejects.toMatchObject({ status: 422 });
    expect(update).not.toHaveBeenCalled();
  });

  it("offers Lifecare's own types once the beräkning is saved there", async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue(forEdit());

    expect(await new ErrandNormberakningService().types('errand-1')).toEqual({
      incomeTypes: [{ code: '1', displayName: 'Lön efter skatt' }],
      costTypes: [{ code: '3', displayName: 'Boendekostnad' }],
      livingCostTypes: [],
    });
  });
});
