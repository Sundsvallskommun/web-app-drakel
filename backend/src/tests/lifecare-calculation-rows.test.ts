import {
  LifecareCalculationExpenseRaw,
  LifecareCalculationForEditRaw,
  LifecareCalculationIncomeRaw,
  LifecareCalculationRaw,
} from '@interfaces/lifecare-calculation.interface';
import {
  addExpense,
  addIncome,
  addPerson,
  changeExpense,
  changeIncome,
  changePerson,
  removeExpense,
  removePerson,
  toLifecareDraftView,
} from '@utils/lifecare-calculation-rows';
import { describe, expect, it } from 'vitest';

const income = (overrides: Partial<LifecareCalculationIncomeRaw> = {}): LifecareCalculationIncomeRaw => ({
  calculationId: 30,
  serialNumber: 10000,
  incomeType: 'Aktivitetsstöd',
  amountApplicant: 5600,
  applicantSearchDate: '2026-06-17',
  applicantNote: '',
  amountCoApplicant: 0,
  coApplicantSearchDate: '',
  grossAmountApplicant: 5600,
  grossAmountCoApplicant: 0,
  incomeCode: 19,
  ...overrides,
});

const expense = (overrides: Partial<LifecareCalculationExpenseRaw> = {}): LifecareCalculationExpenseRaw => ({
  calculationId: 30,
  serialNumber: 10000,
  expenseCode: 3,
  expenseType: 'Boendekostnad',
  appliedAmount: 5000,
  approvedAmount: 5000,
  note: '',
  ...overrides,
});

const calculation = (overrides: Partial<LifecareCalculationRaw> = {}): LifecareCalculationRaw => ({
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
  calculationIncomes: [income()],
  calculationExpenses: [expense()],
  calculationSpecialExpenses: [],
  hasCustomHouseholdSize: false,
  isFinalized: false,
  updateTimestamp: '2026-09-24',
  sumInk: 5600,
  sumUtg: 5000,
  sumSpec: 0,
  ...overrides,
});

const forEdit = (saved: LifecareCalculationRaw = calculation()): LifecareCalculationForEditRaw => ({
  calculation: saved,
  norms: [{ normId: 1, name: 'Riksnorm 2026' }],
  incomeTypes: [
    { id: 19, text: 'Aktivitetsstöd', isActive: true },
    { id: 1, text: 'Lön efter skatt', isActive: true, isJobStimulus: true, jobStimulusPercent: 25 },
  ],
  expenseTypes: [
    { id: 3, text: 'Boendekostnad', isActive: true },
    { id: 8, text: 'A-kasseavgift', isActive: true },
  ],
  specialExpenseTypes: [{ id: 3, text: 'Glasögon', isActive: true }],
});

describe('toLifecareDraftView', () => {
  it("shows Lifecare's beräkning in the tab's draft shape, marked as Lifecare's", () => {
    const view = toLifecareDraftView(forEdit(), '2026-09');

    expect(view).toMatchObject({
      source: 'LIFECARE',
      finalized: false,
      applicationMonth: '2026-09',
      normTypeDisplayNames: ['Riksnorm 2026'],
      calculationFromDate: '2026-09-01',
      incomeSum: 5600,
      expenseSum: 5000,
    });
    expect(view.persons).toEqual([
      expect.objectContaining({ id: '1', personalNumber: '880209-T050', included: true, amount: 3940, normInterval: 'Ensamstående' }),
    ]);
    expect(view.incomes).toEqual([
      expect.objectContaining({
        id: '19',
        typeName: 'Aktivitetsstöd',
        applicantCaseworkerAmount: 5600,
        applicantAmountDate: '2026-06-17',
        note: undefined,
      }),
    ]);
    expect(view.expenses).toEqual([
      expect.objectContaining({ id: 'E-3', bucket: 'EXPENSE', costType: '3', appliedAmount: 5000, caseworkerAmount: 5000 }),
    ]);
  });

  it('shows the gross the handläggare entered on an income jobbstimulans applies to', () => {
    const saved = calculation({
      calculationIncomes: [income({ incomeCode: 1, incomeType: 'Lön efter skatt', amountApplicant: 3750, grossAmountApplicant: 5000 })],
    });

    expect(toLifecareDraftView(forEdit(saved), undefined).incomes?.[0]?.applicantCaseworkerAmount).toBe(5000);
  });

  it('leaves out rows Lifecare drops, and names repeated utgifter apart', () => {
    const saved = calculation({
      calculationIncomes: [income({ amountApplicant: 0, grossAmountApplicant: 0 })],
      calculationExpenses: [expense(), expense({ appliedAmount: 0, approvedAmount: 0 }), expense({ appliedAmount: 200, approvedAmount: 200 })],
    });

    const view = toLifecareDraftView(forEdit(saved), undefined);

    expect(view.incomes).toEqual([]);
    expect(view.expenses?.map(row => row.id)).toEqual(['E-3', 'E-3-3']);
  });
});

describe('members as barn', () => {
  it('counts a bonusbarn, and anyone but the sökande under 18 at the start of the period, as a barn', () => {
    const member = calculation().calculationPersons[0];
    if (!member) {
      throw new Error('the beräkning has no sökande');
    }
    const saved = calculation({
      calculationPersons: [
        { ...member, birthDate: '1988-02-09' },
        { ...member, personId: '20141201T010', personKey: 2, birthDate: '2014-12-01' },
        { ...member, personId: '20080831T020', personKey: 3, birthDate: '2008-08-31' },
        { ...member, personId: '20100101T030', personKey: 4, birthDate: '2010-01-01', isBonusChild: true },
      ],
    });

    expect(toLifecareDraftView(forEdit(saved), undefined).persons?.map(person => person.role)).toEqual([
      'APPLICANT',
      'CHILD',
      undefined,
      'VISITATION_CHILD',
    ]);
  });
});

describe('changing rows', () => {
  it('adds an income of a Lifecare type, by name', () => {
    const changed = addIncome(calculation(), forEdit().incomeTypes, { typeName: 'Lön efter skatt', applicantCaseworkerAmount: 5000 });

    expect(changed.calculationIncomes[changed.calculationIncomes.length - 1]).toMatchObject({
      incomeCode: 1,
      incomeType: 'Lön efter skatt',
      amountApplicant: 5000,
      grossAmountApplicant: 5000,
      serialNumber: 0,
    });
  });

  it('refuses an income type the beräkning already has, or one Lifecare does not know', () => {
    expect(() => addIncome(calculation(), forEdit().incomeTypes, { typeName: 'Aktivitetsstöd', applicantCaseworkerAmount: 1 })).toThrow(
      expect.objectContaining({ status: 422 }),
    );
    expect(() => addIncome(calculation(), forEdit().incomeTypes, { typeName: 'Okänd' })).toThrow(expect.objectContaining({ status: 422 }));
  });

  it('changes an income by its code, date and note included', () => {
    const changed = changeIncome(calculation(), '19', {
      applicantCaseworkerAmount: 6000,
      applicantAmountDate: '2026-09-02T00:00:00+02:00',
      note: 'Enligt beslut',
    });

    expect(changed.calculationIncomes[0]).toMatchObject({ amountApplicant: 6000, applicantSearchDate: '2026-09-02', applicantNote: 'Enligt beslut' });
  });

  it('adds an utgift or a levnadskostnad i övrigt by Lifecare code into its own list', () => {
    const utgift = addExpense(calculation(), forEdit(), { bucket: 'EXPENSE', costType: '8', caseworkerAmount: 120 });
    const levnadskostnad = addExpense(calculation(), forEdit(), {
      bucket: 'SPECIAL_EXPENSE',
      costType: '3',
      appliedAmount: 900,
      caseworkerAmount: 800,
    });

    expect(utgift.calculationExpenses[utgift.calculationExpenses.length - 1]).toMatchObject({
      expenseCode: 8,
      expenseType: 'A-kasseavgift',
      appliedAmount: 120,
      approvedAmount: 120,
    });
    expect(levnadskostnad.calculationSpecialExpenses).toEqual([
      expect.objectContaining({ expenseCode: 3, expenseType: 'Glasögon', appliedAmount: 900, approvedAmount: 800 }),
    ]);
  });

  it('changes and removes the utgift the id names, and no other', () => {
    const saved = calculation({ calculationExpenses: [expense(), expense({ appliedAmount: 200, approvedAmount: 200 })] });

    expect(changeExpense(saved, 'E-3-2', { caseworkerAmount: 150 }).calculationExpenses.map(row => row.approvedAmount)).toEqual([5000, 150]);
    expect(removeExpense(saved, 'E-3').calculationExpenses.map(row => row.approvedAmount)).toEqual([0, 200]);
    expect(() => changeExpense(saved, 'S-3', { caseworkerAmount: 1 })).toThrow(expect.objectContaining({ status: 404 }));
  });
});

describe('changing members', () => {
  const child = {
    personId: '20141201T010',
    personKey: 2,
    name: 'Testbarn Test, Testar',
    normRow: null,
    amount: 0,
    included: true,
    deviationFromDate: '',
    deviationToDate: '',
    personIdFormatted: '141201-T010',
  };
  const withChild = calculation({ calculationPersons: [...calculation().calculationPersons, child] });

  it('sets whether a member is in the beräkning and the dates they are', () => {
    const changed = changePerson(withChild, '2', { included: true, deviationFromDate: '2026-09-10T00:00:00+02:00', deviationToDate: '2026-09-20' });

    expect(changed.calculationPersons[1]).toMatchObject({ included: true, deviationFromDate: '2026-09-10', deviationToDate: '2026-09-20' });
  });

  it('takes a member out of the beräkning, but never the sökande', () => {
    expect(removePerson(withChild, '2').calculationPersons.map(person => person.personKey)).toEqual([1]);
    expect(() => removePerson(withChild, '1')).toThrow(expect.objectContaining({ status: 422 }));
  });

  it('refuses to take in a person the beräkning already has', () => {
    expect(() => addPerson(withChild, { ...child, personKey: 0 }, true)).toThrow(expect.objectContaining({ status: 422 }));
  });
});
