import { LifecareCalculationCataloguesRaw, LifecareCalculationPersonRaw, LifecareCalculationRaw } from '@interfaces/lifecare-calculation.interface';
import {
  applyDraft,
  buildCalculationCreate,
  buildCalculationUpdate,
  CalculationDraftInput,
  householdSizeOf,
  withPlacedPersons,
} from '@utils/lifecare-calculation';
import { describe, expect, it } from 'vitest';

import { NormExpenseRowBucketEnum, NormPersonRowRoleEnum } from '@/data-contracts/caremanagement/data-contracts';

const person = (personId: string, name: string, personIdFormatted: string): LifecareCalculationPersonRaw => ({
  calculationId: 0,
  personId,
  personKey: 0,
  name,
  normRowId: 0,
  normRow: null,
  amount: 0,
  deviationFromDate: '',
  deviationToDate: '',
  deviationDays: null,
  lunchDeduction: 0,
  included: false,
  birthDate: '',
  relationType: 0,
  isBonusChild: '',
  personIdFormatted,
});

const applicant = person('19880209T050', 'Testsson, Test', '880209-T050');
const child = person('20141201T010', 'Testbarn Test, Testar', '141201-T010');

/** Calculation/GetProposalService?businessType=8&businessId=1 (capture 2026-09-24), trimmed to what matters. */
const blank = (): LifecareCalculationRaw => ({
  calculationId: 0,
  serviceId: 1,
  investigationId: 0,
  aktualiseringId: 0,
  normId: 1,
  normText: null,
  date: '2026-09-24',
  startDate: '',
  endDate: '',
  calculationSummary: null,
  calculationPersons: [{ ...applicant }, { ...child }],
  calculationIncomes: [
    { calculationId: 0, serialNumber: 0, incomeType: 'Lön efter skatt', amountApplicant: 0, amountCoApplicant: 0, incomeCode: 1, changeable: false },
  ],
  calculationExpenses: [
    {
      calculationId: 0,
      serialNumber: 0,
      expenseCode: 8,
      expenseType: 'A-kasseavgift',
      appliedAmount: 0,
      approvedAmount: 0,
      note: null,
      changeable: false,
      markForCopy: false,
      showMarkForCopy: false,
    },
  ],
  calculationSpecialExpenses: [],
  householdSize: 0,
  hasCustomHouseholdSize: false,
  isFinalized: false,
  numberOfFamilyMembers: 0,
  updateTimestamp: '',
});

const catalogues: LifecareCalculationCataloguesRaw = {
  norms: [
    { normId: 1, name: 'Riksnorm 2026' },
    { normId: 3, name: 'Nettonorm 2026' },
  ],
  incomeTypes: [
    { id: 1, text: 'Lön efter skatt', isActive: true },
    { id: 27, text: 'Efterlevandestöd', isActive: true },
  ],
  expenseTypes: [
    { id: 8, text: 'A-kasseavgift', isActive: true },
    { id: 3, text: 'Boendekostnad', isActive: true },
  ],
  specialExpenseTypes: [{ id: 7, text: 'Tandvård', isActive: true }],
};

const draft = (): CalculationDraftInput => ({
  normId: 1,
  calculationFromDate: '2026-09-01',
  calculationToDate: '2026-09-30',
  hasCustomHouseholdSize: false,
  persons: [
    { role: NormPersonRowRoleEnum.APPLICANT, name: 'Test Testsson', included: true, personalNumber: '880209-T050' },
    { role: NormPersonRowRoleEnum.CHILD, name: 'Testar', included: false, personalNumber: '141201-T010' },
  ],
  incomes: [{ typeId: 27, typeName: 'Efterlevandestöd', applicantEffectiveAmount: 1500 }],
  expenses: [
    { bucket: NormExpenseRowBucketEnum.EXPENSE, costTypeDisplayName: 'Boendekostnad', appliedAmount: 6000, effectiveAmount: 5500 },
    { bucket: NormExpenseRowBucketEnum.EXPENSE, costTypeDisplayName: 'A-kasseavgift', effectiveAmount: 454, specification: 'jkljkl' },
  ],
  specialExpenses: [{ bucket: NormExpenseRowBucketEnum.SPECIAL_EXPENSE, costTypeDisplayName: 'Tandvård', effectiveAmount: 300 }],
});

describe('applyDraft', () => {
  it('fills the underlag from the draft: period, who is included, and every income and expense', () => {
    const filled = applyDraft(blank(), [], draft(), catalogues, '2026-09-24');
    if (!filled.writable) throw new Error(filled.reason);
    const { calculation } = filled;

    expect([calculation.startDate, calculation.endDate, calculation.normId]).toEqual(['2026-09-01', '2026-09-30', 1]);
    expect(calculation.calculationPersons.map(member => [member.name, member.included])).toEqual([
      ['Testsson, Test', true],
      ['Testbarn Test, Testar', false],
    ]);
    // An income type the underlag lacks gets a row of its own; the default one stays at 0.
    expect(calculation.calculationIncomes.map(row => [row.incomeCode, row.amountApplicant])).toEqual([
      [1, 0],
      [27, 1500],
    ]);
    expect(calculation.calculationExpenses.map(row => [row.expenseType, row.appliedAmount, row.approvedAmount, row.note])).toEqual([
      ['A-kasseavgift', 454, 454, 'jkljkl'],
      ['Boendekostnad', 6000, 5500, null],
    ]);
    expect(calculation.calculationSpecialExpenses.map(row => [row.expenseType, row.approvedAmount])).toEqual([['Tandvård', 300]]);
  });

  it('takes the sökande as Lifecare’s first member when no personnummer matches, as with a reserve number', () => {
    const withoutNumbers = { ...draft(), persons: draft().persons?.map(member => ({ ...member, personalNumber: undefined })) };

    const filled = applyDraft(blank(), [], withoutNumbers, catalogues, '2026-09-24');

    expect(filled.writable && filled.calculation.calculationPersons[0]?.included).toBe(true);
  });

  it('brings back a member a saved beräkning left out, so the handläggare can include them again', () => {
    const saved = { ...blank(), calculationId: 31, calculationPersons: [{ ...applicant, included: true }] };
    const includeChild = { ...draft(), persons: draft().persons?.map(member => ({ ...member, included: true })) };

    const filled = applyDraft(saved, [applicant, child], includeChild, catalogues, '2026-09-24');

    expect(filled.writable && filled.calculation.calculationPersons.map(member => [member.personId, member.included])).toEqual([
      ['19880209T050', true],
      ['20141201T010', true],
    ]);
  });

  it('refuses a row whose type Lifecare does not know, rather than leaving it out', () => {
    const unknown = {
      ...draft(),
      expenses: [{ bucket: NormExpenseRowBucketEnum.EXPENSE, costTypeDisplayName: 'Påhittad kostnad', effectiveAmount: 10 }],
    };

    expect(applyDraft(blank(), [], unknown, catalogues, '2026-09-24')).toEqual({
      writable: false,
      reason: expect.stringContaining('Påhittad kostnad') as string,
    });
  });

  it('refuses a draft without a period and a household with a medsökande', () => {
    expect(applyDraft(blank(), [], { ...draft(), calculationToDate: undefined }, catalogues, '2026-09-24').writable).toBe(false);
    const withCoApplicant = {
      ...draft(),
      persons: [...(draft().persons ?? []), { role: NormPersonRowRoleEnum.CO_APPLICANT, name: 'Medsökande', included: true }],
    };
    expect(applyDraft(blank(), [], withCoApplicant, catalogues, '2026-09-24').writable).toBe(false);
  });
});

describe('building the bodies', () => {
  const placed = (): LifecareCalculationRaw => {
    const filled = applyDraft(blank(), [], draft(), catalogues, '2026-09-24');
    if (!filled.writable) throw new Error(filled.reason);
    // Calculation/PlacePersons (capture 2026-09-24): Riksnorm, Ensamstående, 3 940.
    return withPlacedPersons(filled.calculation, [{ ...applicant, included: true, normRowId: 2, amount: 3940 }]);
  };

  it('sends a new beräkning the way the web app does (capture 2026-09-24)', () => {
    const calculation = placed();
    const body = buildCalculationCreate(calculation, householdSizeOf(calculation, draft()));

    const [sentApplicant, sentChild] = body.calculationPersons as Record<string, unknown>[];
    expect(sentApplicant).toMatchObject({
      normRowId: 2,
      amount: 3940,
      isValid: true,
      normSubscription: { da: 2, Jb: false, Kb: null, hb: null },
      dateSubscriptions: [
        { da: '', Jb: false, Kb: null, hb: null },
        { da: '', Jb: false, Kb: null, hb: null },
      ],
      daySubscription: { da: null, Jb: false, Kb: null, hb: null },
    });
    // A member never placed goes without a norm row at all.
    expect(sentChild).not.toHaveProperty('normRowId');
    expect(sentChild?.normSubscription).toEqual({ Jb: false, Kb: null, hb: null });
    expect(body.calculationIncomes).toEqual(expect.arrayContaining([expect.objectContaining({ changeable: true, isValid: true })]));
    expect(body).not.toHaveProperty('aktualiseringId');
    expect(body).not.toHaveProperty('householdSize');
    expect(body).not.toHaveProperty('numberOfFamilyMembers');
    expect(Object.keys(body).slice(-3)).toEqual(['HasCustomHouseholdSize', 'HouseholdSize', 'NumberOfFamilyMembers']);
    expect([body.HasCustomHouseholdSize, body.HouseholdSize, body.NumberOfFamilyMembers]).toEqual([false, 1, 1]);
  });

  it('sends a change with the household size where Lifecare read it and at the end', () => {
    const calculation = { ...placed(), calculationId: 31 };
    const body = buildCalculationUpdate(calculation, { custom: true, size: 3, members: 1 });

    expect(body).toMatchObject({ calculationId: 31, aktualiseringId: 0, householdSize: 3, numberOfFamilyMembers: 1 });
    expect(Object.keys(body).slice(-3)).toEqual(['HasCustomHouseholdSize', 'HouseholdSize', 'NumberOfFamilyMembers']);
  });
});
