import { LifecareCalculationProposalRaw, LifecareCalculationRaw } from '@interfaces/lifecare-calculation.interface';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import ErrandLifecareCalculationService from '@services/errand-lifecare-calculation.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import LifecareJobStimulusService from '@services/lifecare-job-stimulus.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NormPersonRowRoleEnum } from '@/data-contracts/caremanagement/data-contracts';

const applicant = {
  personId: '19880209T050',
  name: 'Testsson, Test',
  normRowId: 0,
  normRow: null,
  amount: 0,
  included: false,
  deviationFromDate: '',
  deviationToDate: '',
  personIdFormatted: '880209-T050',
};

const calculation = (overrides: Partial<LifecareCalculationRaw> = {}): LifecareCalculationRaw => ({
  calculationId: 0,
  normId: 1,
  normText: null,
  date: '2026-09-24',
  startDate: '',
  endDate: '',
  calculationSummary: null,
  calculationPersons: [{ ...applicant }],
  calculationIncomes: [],
  calculationExpenses: [],
  calculationSpecialExpenses: [],
  hasCustomHouseholdSize: false,
  isFinalized: false,
  updateTimestamp: '',
  ...overrides,
});

const proposal: LifecareCalculationProposalRaw = {
  calculation: calculation(),
  norms: [{ normId: 1, name: 'Riksnorm 2026' }],
  incomeTypes: [],
  expenseTypes: [],
  specialExpenseTypes: [],
};

/** Calculation/Create's answer (capture 2026-09-24): beräkning 31 with Lifecare's summering. */
const saved = calculation({
  calculationId: 31,
  normText: 'Riksnorm 2026',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  updateTimestamp: '2026-09-24',
  calculationPersons: [{ ...applicant, included: true, normRowId: 2, normRow: 'Ensamstående', amount: 3940 }],
  calculationSummary: {
    income: 0,
    jobStimulus: 0,
    jobStimulusDeduction: 0,
    norm: -5220,
    expences: 0,
    sum: -5220,
    specialPurpose: 0,
    balance: -5220,
    deficitSum: 5220,
    commonHouseholdCost: 1280,
    familyCost: 3940,
  },
});

const withCalculationId = (lifecareCalculationId?: number) =>
  vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
    data: { lifecareServiceId: 1, data: { lifecareCalculationId } },
    message: 'success',
  });

describe('ErrandLifecareCalculationService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementNormberakningService.prototype, 'readDraft').mockResolvedValue({
      data: {
        normId: 1,
        calculationFromDate: '2026-09-01',
        calculationToDate: '2026-09-30',
        persons: [{ role: NormPersonRowRoleEnum.APPLICANT, included: true, personalNumber: '880209-T050' }],
      },
      message: 'success',
    });
    vi.spyOn(LifecareCalculationsService.prototype, 'readProposal').mockResolvedValue(proposal);
    vi.spyOn(LifecareCalculationsService.prototype, 'placePersons').mockResolvedValue({
      calculationPersons: [{ ...applicant, included: true, normRowId: 2, amount: 3940 }],
    });
    vi.spyOn(LifecareCalculationsService.prototype, 'withJobStimuli').mockResolvedValue(calculation({ hasApplicantJobStimuli: true }));
    vi.spyOn(LifecareJobStimulusService.prototype, 'readForService').mockResolvedValue({ applicant: null, coApplicant: null, hasCoApplicant: false });
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates the beräkning the first time, placed on the norm, and points the errand at it', async () => {
    withCalculationId(undefined);
    const create = vi.spyOn(LifecareCalculationsService.prototype, 'create').mockResolvedValue(saved);
    const link = vi.spyOn(CaremanagementErrandService.prototype, 'setLifecareCalculationId').mockResolvedValue();

    const view = await new ErrandLifecareCalculationService().save('errand-1');

    const body = create.mock.calls[0]?.[1] as { calculationPersons: { normRowId: number; amount: number }[]; hasApplicantJobStimuli: boolean };
    expect(create.mock.calls[0]?.[0]).toBe(1);
    expect(body.calculationPersons[0]).toMatchObject({ normRowId: 2, amount: 3940 });
    expect(body.hasApplicantJobStimuli).toBe(true);
    expect(link).toHaveBeenCalledWith('errand-1', 31);
    // Lifecare's summering, signed the way the handläggare reads it.
    expect(view.summary).toMatchObject({ norm: 5220, familyCost: 3940, commonHouseholdCost: 1280, result: -5220 });
  });

  it('changes the same beräkning every time after, never making a second one', async () => {
    withCalculationId(31);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue({ ...proposal, calculation: saved });
    const create = vi.spyOn(LifecareCalculationsService.prototype, 'create');
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue(saved);

    await new ErrandLifecareCalculationService().save('errand-1');

    expect(create).not.toHaveBeenCalled();
    expect(update.mock.calls[0]?.[0]).toBe(31);
    expect(update.mock.calls[0]?.[1]).toMatchObject({ calculationId: 31, HouseholdSize: 1 });
  });

  it('saves as slutlig with isFinalized on the same beräkning', async () => {
    withCalculationId(31);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue({ ...proposal, calculation: saved });
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue({ ...saved, isFinalized: true });

    const view = await new ErrandLifecareCalculationService().save('errand-1', true);

    expect(update.mock.calls[0]?.[1]).toMatchObject({ calculationId: 31, isFinalized: true });
    expect(view.finalized).toBe(true);
  });

  it('creates the beräkning first when saving as slutlig before it exists', async () => {
    withCalculationId(undefined);
    vi.spyOn(LifecareCalculationsService.prototype, 'create').mockResolvedValue(saved);
    vi.spyOn(CaremanagementErrandService.prototype, 'setLifecareCalculationId').mockResolvedValue();
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue({ ...proposal, calculation: saved });
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue({ ...saved, isFinalized: true });

    await new ErrandLifecareCalculationService().save('errand-1', true);

    expect(update.mock.calls[0]?.[0]).toBe(31);
    expect(update.mock.calls[0]?.[1]).toMatchObject({ isFinalized: true });
  });

  it('refuses to change a beräkning saved as slutlig', async () => {
    withCalculationId(31);
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue({ ...proposal, calculation: { ...saved, isFinalized: true } });
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update');

    await expect(new ErrandLifecareCalculationService().save('errand-1')).rejects.toMatchObject({ status: 422 });
    expect(update).not.toHaveBeenCalled();
  });

  it('gives the beräkning as Lifecare prints it, and nothing before it is saved', async () => {
    withCalculationId(31);
    const print = vi.spyOn(LifecareCalculationsService.prototype, 'printCalculation').mockResolvedValue(Buffer.from('%PDF-1.7'));

    expect((await new ErrandLifecareCalculationService().pdf('errand-1')).toString('latin1')).toBe('%PDF-1.7');
    expect(print).toHaveBeenCalledWith(31);

    withCalculationId(undefined);
    await expect(new ErrandLifecareCalculationService().pdf('errand-1')).rejects.toMatchObject({ status: 404 });
  });

  it('has no beräkning to show before one is saved', async () => {
    withCalculationId(undefined);

    expect(await new ErrandLifecareCalculationService().read('errand-1')).toBeUndefined();
  });
});
