import { LifecareCalculationForEditRaw, LifecareCalculationPersonRaw, LifecareCalculationRaw } from '@interfaces/lifecare-calculation.interface';
import { LifecareHouseholdRaw } from '@interfaces/lifecare-household.interface';
import CaremanagementErrandService from '@services/caremanagement-errand.service';
import CaremanagementEventService from '@services/caremanagement-event.service';
import ErrandLifecareHouseholdService from '@services/errand-lifecare-household.service';
import LifecareCalculationsService from '@services/lifecare-calculations.service';
import LifecareHouseholdsService from '@services/lifecare-households.service';
import LifecareJobStimulusService from '@services/lifecare-job-stimulus.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const applicant: LifecareCalculationPersonRaw = {
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
};

/** Calculation/GetProposalForPerson for the bonusbarn (capture 2026-09-24). */
const proposedChild: LifecareCalculationPersonRaw = {
  calculationId: 0,
  personId: '20141201T010',
  personKey: 0,
  name: 'Testbarn Test, Testar',
  normRowId: 0,
  normRow: null,
  amount: 0,
  deviationFromDate: '',
  deviationToDate: '',
  deviationDays: null,
  included: false,
  birthDate: '2014-12-01',
  relationType: 0,
  isBonusChild: '',
  personIdFormatted: '141201-T010',
};

const saved: LifecareCalculationRaw = {
  calculationId: 31,
  normId: 6,
  normText: 'Specnorm',
  date: '2026-09-24',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  calculationSummary: null,
  calculationPersons: [applicant],
  calculationIncomes: [],
  calculationExpenses: [],
  calculationSpecialExpenses: [],
  hasCustomHouseholdSize: false,
  isFinalized: false,
  updateTimestamp: '2026-09-24',
};

const forEdit: LifecareCalculationForEditRaw = {
  calculation: saved,
  calculationNotBeforeDate: '2026-06-16',
  norms: [],
  incomeTypes: [],
  expenseTypes: [],
  specialExpenseTypes: [],
};

/** Household/ListHouseholdsForPerson (capture 2026-09-24), trimmed. */
const household = (bonusChildren: LifecareHouseholdRaw['householdBonusChildren'] = []): LifecareHouseholdRaw => ({
  householdId: 1,
  personId: '19880209T050',
  fromDate: '2026-06-16',
  toDate: '',
  householdMembers: [
    {
      personId: '19880209T050',
      name: 'Testsson, Test',
      relationType: 2,
      relationText: 'Ensamstående',
      householdHead: true,
      deviatingFromDate: '',
      deviatingToDate: '',
      coApplicant: false,
      markedForRemoval: false,
      personIdFormatted: '880209-T050',
    },
  ],
  householdBonusChildren: bonusChildren,
});

const child = { personId: '20141201T010', name: 'Testbarn Test, Testar', markedForRemoval: false, personIdFormatted: '141201-T010' };

const withCalculationId = (lifecareCalculationId?: number) =>
  vi.spyOn(CaremanagementErrandService.prototype, 'getFinancialAssistanceView').mockResolvedValue({
    data: { lifecareServiceId: 1, data: { lifecareCalculationId } },
    message: 'success',
  });

describe('ErrandLifecareHouseholdService', () => {
  beforeEach(() => {
    vi.spyOn(CaremanagementEventService.prototype, 'reportLifecareAccess').mockResolvedValue();
    vi.spyOn(LifecareCalculationsService.prototype, 'readForEdit').mockResolvedValue(forEdit);
    vi.spyOn(LifecareJobStimulusService.prototype, 'readForService').mockResolvedValue({ applicant: null, coApplicant: null, hasCoApplicant: false });
    vi.spyOn(LifecareCalculationsService.prototype, 'placePersons').mockImplementation(body =>
      Promise.resolve({ calculationPersons: body.calculationPersons as LifecareCalculationPersonRaw[] }),
    );
    vi.spyOn(LifecareCalculationsService.prototype, 'withJobStimuli').mockImplementation(calculation =>
      Promise.resolve(calculation as LifecareCalculationRaw),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the sökandes hushåll and who of it the beräkning takes in', async () => {
    withCalculationId(31);
    const list = vi.spyOn(LifecareHouseholdsService.prototype, 'listForPerson').mockResolvedValue({ households: [household([child])] });

    const view = await new ErrandLifecareHouseholdService().read('errand-1');

    expect(list).toHaveBeenCalledWith('19880209T050');
    expect(view.persons).toEqual([
      {
        personId: '19880209T050',
        personalNumber: '880209-T050',
        name: 'Testsson, Test',
        relation: 'Ensamstående',
        bonusChild: false,
        inCalculation: true,
      },
      { personId: '20141201T010', personalNumber: '141201-T010', name: 'Testbarn Test, Testar', bonusChild: true, inCalculation: false },
    ]);
  });

  it('adds a bonusbarn to the hushåll and takes them into the beräkning, as Lifecare marks one', async () => {
    withCalculationId(31);
    vi.spyOn(LifecareHouseholdsService.prototype, 'listForPerson').mockResolvedValue({ households: [household()] });
    const addBonusChild = vi.spyOn(LifecareHouseholdsService.prototype, 'addBonusChild').mockResolvedValue();
    const proposal = vi.spyOn(LifecareCalculationsService.prototype, 'proposalForPerson').mockResolvedValue(proposedChild);
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue(saved);

    await new ErrandLifecareHouseholdService().addBonusChild('errand-1', '20141201T010');

    expect(addBonusChild).toHaveBeenCalledWith(1, '20141201T010');
    expect(proposal.mock.calls[0]?.[0]).toMatchObject({
      startDate: '2026-09-01',
      endDate: '2026-09-30',
      normId: 6,
      calculationNotBeforeDate: '2026-06-16',
      person: '20141201T010',
    });
    const body = update.mock.calls[0]?.[1] as { calculationPersons: Record<string, unknown>[] };
    expect(body.calculationPersons[1]).toMatchObject({ personId: '20141201T010', included: true, isBonusChild: true, deviationDays: '' });
  });

  it('does not add a bonusbarn the hushåll already has, only takes them in', async () => {
    withCalculationId(31);
    vi.spyOn(LifecareHouseholdsService.prototype, 'listForPerson').mockResolvedValue({ households: [household([child])] });
    const addBonusChild = vi.spyOn(LifecareHouseholdsService.prototype, 'addBonusChild');
    vi.spyOn(LifecareCalculationsService.prototype, 'proposalForPerson').mockResolvedValue(proposedChild);
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update').mockResolvedValue(saved);

    await new ErrandLifecareHouseholdService().addBonusChild('errand-1', '20141201T010');

    expect(addBonusChild).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalled();
  });

  it('refuses to take in a person who is not in the hushåll', async () => {
    withCalculationId(31);
    vi.spyOn(LifecareHouseholdsService.prototype, 'listForPerson').mockResolvedValue({ households: [household()] });
    const update = vi.spyOn(LifecareCalculationsService.prototype, 'update');

    await expect(new ErrandLifecareHouseholdService().includePerson('errand-1', '20141201T010')).rejects.toMatchObject({ status: 422 });
    expect(update).not.toHaveBeenCalled();
  });

  it('asks for the beräkning to be saved in Lifecare first', async () => {
    withCalculationId(undefined);

    await expect(new ErrandLifecareHouseholdService().read('errand-1')).rejects.toMatchObject({ status: 422 });
  });
});
