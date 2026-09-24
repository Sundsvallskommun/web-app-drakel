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

  it("has Lifecare count a member's amount again when the days or the normintervall change", async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue(
      forEdit({ ...saved, norm: { rows: [{ rowId: 2, name: 'Ensamstående 3940.00', monthlyAmount: 3940, dailyAmount: 130 }] } }),
    );
    const amountFor = vi.spyOn(LifecareCalculationsService.prototype, 'amountFor').mockResolvedValue(1300);
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue(saved);

    await new ErrandNormberakningService().updateRow('errand-1', 'persons', '1', { caseworkerDays: 10, normRowId: 2 });

    expect(amountFor.mock.calls[0]?.[0]).toMatchObject({ personId: '19880209T050', normRowId: 2, deviationDays: 10 });
    // The norm row goes along whole, as the web app sends it (capture lifecare7).
    expect(amountFor.mock.calls[0]?.[1]).toMatchObject({ rowId: 2, name: 'Ensamstående 3940.00', monthlyAmount: 3940 });
    const body = update.mock.calls[0]?.[1] as { calculationPersons: Record<string, unknown>[] };
    expect(body.calculationPersons[0]).toMatchObject({
      normRowId: 2,
      amount: 1300,
      deviationDays: 10,
      daySubscription: { da: 10, Jb: false, Kb: null, hb: null },
    });
  });

  it('keeps a normintervall a member already has when the beräkning is saved again', async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue(forEdit());
    // Lifecare would place the sökande elsewhere; the row it is on stays.
    vi.spyOn(LifecareCalculationsService.prototype, 'placePersons').mockResolvedValue({
      calculationPersons: [
        { ...saved.calculationPersons[0], normRowId: 1, normRow: 'Make/maka/sambo', amount: 3550 },
      ] as typeof saved.calculationPersons,
    });
    const amountFor = vi.spyOn(LifecareCalculationsService.prototype, 'amountFor');
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue(saved);

    await new ErrandNormberakningService().updateRow('errand-1', 'expenses', 'E-3', { appliedAmount: 5000, caseworkerAmount: 5000 });

    const body = update.mock.calls[0]?.[1] as { calculationPersons: Record<string, unknown>[] };
    expect(body.calculationPersons[0]).toMatchObject({ normRowId: 2, amount: 3940 });
    expect(amountFor).not.toHaveBeenCalled();
  });

  it('sets an own household size in Lifecare, saved for coming beräkningar, and counts the gemensamma kostnader', async () => {
    withCalculationId(30);
    // Norm 1's gemensamma kostnader by household size (capture 2026-09-24).
    const norm = {
      shared: [
        { normId: 1, noOfMembers: 1, monthlyAmount: 1280 },
        { normId: 1, noOfMembers: 4, monthlyAmount: 2030 },
      ],
    };
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue(forEdit({ ...saved, norm }));
    const sharedCost = vi.spyOn(LifecareCalculationsService.prototype, 'sharedCost').mockResolvedValue(2030);
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue(saved);

    await new ErrandNormberakningService().updateHeader('errand-1', { hasCustomHouseholdSize: true, householdSize: 4 });

    expect(sharedCost).toHaveBeenCalledWith('2026-09-01', '2026-09-30', { normId: 1, noOfMembers: 4, monthlyAmount: 2030 });
    expect(update.mock.calls[0]?.[1]).toMatchObject({
      hasCustomHouseholdSize: true,
      householdSize: 4,
      saveHouseholdSize: true,
      amountForHouseholdSize: 2030,
      // One member's share of a household of four: 2 030 × 1/4.
      commonHouseholdCost: 508,
      HasCustomHouseholdSize: true,
      HouseholdSize: 4,
      NumberOfFamilyMembers: 1,
    });
  });

  it('refuses to change the period of a beräkning in Lifecare, or to put it on a norm Lifecare does not have', async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue(forEdit());
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update');

    await expect(new ErrandNormberakningService().updateHeader('errand-1', { calculationFromDate: '2026-09-02' })).rejects.toMatchObject({
      status: 422,
    });
    await expect(new ErrandNormberakningService().updateHeader('errand-1', { normId: 99 })).rejects.toMatchObject({ status: 422 });
    expect(update).not.toHaveBeenCalled();
  });

  it('puts the beräkning on another norm in Lifecare, every member where Lifecare places them on it', async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue({
      ...forEdit(),
      norms: [
        { normId: 1, name: 'Riksnorm 2026' },
        { normId: 6, name: 'Specnorm' },
      ],
    });
    const place = vi.spyOn(LifecareCalculationsService.prototype, 'placePersons').mockResolvedValue({
      calculationPersons: saved.calculationPersons.map(person => ({ ...person, normRowId: 1, amount: 2000 })),
    });
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue(saved);

    await new ErrandNormberakningService().updateHeader('errand-1', { normId: 6 });

    // Sent on their old rows, as the web app does; Lifecare decides what fits the new norm.
    expect(place.mock.calls[0]?.[0]).toMatchObject({ normId: 6, calculationPersons: [{ normRowId: 2 }] });
    expect(update.mock.calls[0]?.[1]).toMatchObject({ normId: 6, normText: 'Specnorm' });
    const body = update.mock.calls[0]?.[1] as { calculationPersons: Record<string, unknown>[] };
    expect(body.calculationPersons[0]).toMatchObject({ normRowId: 1, amount: 2000 });
  });

  it("tells finalize whether the household has an own size — Lifecare's once the beräkning is there, careM's before", async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue(forEdit({ ...saved, hasCustomHouseholdSize: true }));
    const fromDraft = vi.spyOn(CaremanagementNormberakningService.prototype, 'readHouseholdSizeChanged').mockResolvedValue(false);

    expect(await new ErrandNormberakningService().householdSizeChanged('errand-1')).toBe(true);
    expect(fromDraft).not.toHaveBeenCalled();

    vi.restoreAllMocks();
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
    withCalculationId(undefined);
    vi.spyOn(CaremanagementNormberakningService.prototype, 'readHouseholdSizeChanged').mockResolvedValue(true);

    expect(await new ErrandNormberakningService().householdSizeChanged('errand-1')).toBe(true);
  });

  it('takes the new norm’s rows and amounts Lifecare places the household on, each row named (capture lifecare8)', async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue({
      ...forEdit(),
      norms: [
        { normId: 1, name: 'Riksnorm 2026' },
        { normId: 3, name: 'Norm 3' },
      ],
    });
    vi.spyOn(LifecareCalculationsService.prototype, 'placePersons').mockResolvedValue({
      calculationPersons: saved.calculationPersons.map(person => ({ ...person, normRowId: 1, normRow: null, amount: 4380 })),
      norm: { rows: [{ rowId: 1, name: 'Make/maka/sambo 4380.00', monthlyAmount: 4380 }] },
    });
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue(saved);

    await new ErrandNormberakningService().updateHeader('errand-1', { normId: 3 });

    const body = update.mock.calls[0]?.[1] as { calculationPersons: Record<string, unknown>[] };
    expect(body.calculationPersons[0]).toMatchObject({ normRowId: 1, normRow: 'Make/maka/sambo', amount: 4380 });
  });

  it('leaves a member Lifecare does not place on the new norm without a normintervall, for the handläggare to pick', async () => {
    withCalculationId(30);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue({
      ...forEdit(),
      norms: [
        { normId: 1, name: 'Riksnorm 2026' },
        { normId: 3, name: 'Matnorm 2026' },
      ],
    });
    // capture lifecare7: on a new norm Lifecare answered every member unplaced.
    vi.spyOn(LifecareCalculationsService.prototype, 'placePersons').mockResolvedValue({
      calculationPersons: saved.calculationPersons.map(person => ({ ...person, normRowId: 0, normRow: null, amount: 0 })),
    });
    const amountFor = vi.spyOn(LifecareCalculationsService.prototype, 'amountFor');
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue(saved);

    await new ErrandNormberakningService().updateHeader('errand-1', { normId: 3 });

    const body = update.mock.calls[0]?.[1] as { calculationPersons: Record<string, unknown>[] };
    // Sent unplaced the way the web app sends such a member: no normintervall at all.
    expect(body.calculationPersons[0]).toMatchObject({ amount: 0 });
    expect(body.calculationPersons[0]).not.toHaveProperty('normRowId');
    expect(amountFor).not.toHaveBeenCalled();
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
      norms: [{ code: '1', displayName: 'Riksnorm 2026' }],
      incomeTypes: [{ code: '1', displayName: 'Lön efter skatt' }],
      costTypes: [{ code: '3', displayName: 'Boendekostnad' }],
      livingCostTypes: [],
    });
  });
});
