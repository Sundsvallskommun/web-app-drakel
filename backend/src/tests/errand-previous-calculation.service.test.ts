import { LifecareCalculationRaw } from '@interfaces/lifecare-calculation.interface';
import CaremanagementEventService from '@services/caremanagement-event.service';
import CaremanagementNormberakningService from '@services/caremanagement-normberakning.service';
import CaremanagementStakeholderService from '@services/caremanagement-stakeholder.service';
import ErrandPreviousCalculationService from '@services/errand-previous-calculation.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Calculation/GetCalculation for beräkning 1 (capture 2026-09-24), trimmed to the fields drakel reads. */
const lifecareCalculation: LifecareCalculationRaw = {
  calculationId: 1,
  normId: 1,
  normText: 'Riksnorm 2026',
  date: '2026-06-18',
  startDate: '2026-01-01',
  endDate: '2026-06-30',
  calculationSummary: {
    income: 12300,
    jobStimulus: 0,
    jobStimulusDeduction: 0,
    norm: -26436,
    expences: -5153,
    sum: -20289,
    specialPurpose: -1000,
    balance: -19289,
    deficitSum: 20289,
    commonHouseholdCost: 2796,
    familyCost: 23640,
  },
  calculationPersons: [
    {
      personId: '19880209T050',
      name: 'Testsson, Test',
      normRowId: 2,
      normRow: 'Ensamstående',
      amount: 23640,
      included: true,
      deviationFromDate: '',
      deviationToDate: '',
      personIdFormatted: '880209-T050',
    },
  ],
  calculationIncomes: [
    {
      incomeCode: 19,
      incomeType: 'Aktivitetsstöd',
      amountApplicant: 5600,
      applicantSearchDate: '2026-06-17',
      amountCoApplicant: 0,
      coApplicantSearchDate: '',
    },
  ],
  calculationExpenses: [{ expenseCode: 3, expenseType: 'Boendekostnad', appliedAmount: 5000, approvedAmount: 5000, note: '' }],
  calculationSpecialExpenses: [{ expenseCode: 3, expenseType: 'Glasögon', appliedAmount: 1000, approvedAmount: 1000, note: '' }],
  hasCustomHouseholdSize: true,
  isFinalized: false,
  updateTimestamp: '2026-09-10',
  sumInk: 12300,
  sumUtg: 5153,
  sumSpec: 1000,
  sumNorm: 26436,
  totSum: -20289,
  commonHouseholdCost: 2796,
};

describe('ErrandPreviousCalculationService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementStakeholderService.prototype, 'readStakeholders').mockResolvedValue({
      data: [{ role: 'APPLICANT', externalId: 'party-1' }],
      message: 'success',
    });
    vi.spyOn(CaremanagementNormberakningService.prototype, 'readDraft').mockResolvedValue({
      data: { calculationFromDate: '2026-07-01' },
      message: 'success',
    });
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the previous beräkning from Lifecare and shows it as Lifecare counted it', async () => {
    vi.spyOn(CaremanagementNormberakningService.prototype, 'listCalculations').mockResolvedValue({
      data: [
        { id: 1, fromDate: '2026-01-01' },
        { id: 31, fromDate: '2026-09-01' },
      ],
      message: 'success',
    });
    const read = vi.spyOn(LifecareCalculationsService.prototype, 'read').mockResolvedValue(lifecareCalculation);

    const previous = await new ErrandPreviousCalculationService().read('errand-1');

    expect(read).toHaveBeenCalledWith(1);
    expect(previous).toMatchObject({
      id: 1,
      norm: 'Riksnorm 2026',
      fromDate: '2026-01-01',
      toDate: '2026-06-30',
      incomeSum: 12300,
      expenseSum: 5153,
      specialExpenseSum: 1000,
      normSum: 26436,
      familyCost: 23640,
      balance: -19289,
      incomes: [{ type: 'Aktivitetsstöd', amountApplicant: 5600, applicantSearchDate: '2026-06-17', coApplicantSearchDate: undefined }],
      expenses: [{ type: 'Boendekostnad', appliedAmount: 5000, approvedAmount: 5000 }],
      specialExpenses: [{ type: 'Glasögon', appliedAmount: 1000, approvedAmount: 1000 }],
    });
    // No personnummer leaves the BFF for a view that has no use for it.
    expect(previous?.persons).toEqual([{ name: 'Testsson, Test', amount: 23640, deviationFromDate: undefined, deviationToDate: undefined }]);
  });

  it('has nothing to show when the applicant has no beräkning before the period', async () => {
    vi.spyOn(CaremanagementNormberakningService.prototype, 'listCalculations').mockResolvedValue({
      data: [{ id: 31, fromDate: '2026-09-01' }],
      message: 'success',
    });
    const read = vi.spyOn(LifecareCalculationsService.prototype, 'read');

    expect(await new ErrandPreviousCalculationService().read('errand-1')).toBeNull();
    expect(read).not.toHaveBeenCalled();
  });
});
