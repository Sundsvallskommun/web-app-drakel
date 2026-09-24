import {
  LifecareCalculationCataloguesRaw,
  LifecareCalculationExpenseRaw,
  LifecareCalculationIncomeRaw,
  LifecareCalculationPersonRaw,
  LifecareCalculationRaw,
  LifecareCalculationTypeRaw,
} from '@interfaces/lifecare-calculation.interface';

import {
  CalculationDraft,
  NormExpenseRow,
  NormExpenseRowBucketEnum,
  NormPersonRow,
  NormPersonRowRoleEnum,
} from '@/data-contracts/caremanagement/data-contracts';

/** A draft person with the personnummer the BFF resolved for it. */
type DraftPerson = NormPersonRow & { personalNumber?: string };

/** careM's draft normberäkning, persons carrying their personnummer — the handläggare's working copy. */
export type CalculationDraftInput = Omit<CalculationDraft, 'persons'> & { persons?: DraftPerson[] };

/** Either the beräkning filled from the draft, or why the draft cannot be sent to Lifecare as it stands. */
export type CalculationFill = { writable: true; calculation: LifecareCalculationRaw } | { writable: false; reason: string };

/** How the household size goes to Lifecare. */
export interface HouseholdSize {
  custom: boolean;
  size: number;
  members: number;
}

const refuse = (reason: string): CalculationFill => ({ writable: false, reason });

/** A personnummer or reserve number reduced to what two spellings of it share: `19880209T050` ~ `880209-T050`. */
const identityKey = (identity: string | undefined): string =>
  (identity ?? '')
    .replace(/[^0-9A-Za-z]/g, '')
    .slice(-10)
    .toUpperCase();

const sameName = (first: string, second: string): boolean => first.trim().toLowerCase() === second.trim().toLowerCase();

/** The draft person a Lifecare household member is — by personnummer, else the sökande as Lifecare's first member. */
const draftPersonFor = (member: LifecareCalculationPersonRaw, index: number, draftPersons: DraftPerson[]): DraftPerson | undefined =>
  draftPersons.find(person => person.personalNumber && identityKey(person.personalNumber) === identityKey(member.personId)) ??
  (index === 0 ? draftPersons.find(person => person.role === NormPersonRowRoleEnum.APPLICANT) : undefined);

/** Every household member once: the beräkning's own, then those the household has that the beräkning lacks. */
const householdOf = (calculation: LifecareCalculationRaw, household: LifecareCalculationPersonRaw[]): LifecareCalculationPersonRaw[] => [
  ...calculation.calculationPersons,
  ...household
    .filter(member => !calculation.calculationPersons.some(present => present.personId === member.personId))
    .map(member => ({ ...member, included: false })),
];

/** The draft's own amount for a row: the handläggare's when set, else the process's. */
const effective = (row: { effectiveAmount?: number }): number => row.effectiveAmount ?? 0;

const fillIncomes = (
  base: LifecareCalculationIncomeRaw[],
  draft: CalculationDraftInput,
  types: LifecareCalculationTypeRaw[],
  calculationId: number,
  unknown: string[],
): LifecareCalculationIncomeRaw[] => {
  // Every row starts from nothing, so a row the draft no longer has goes to 0 — and Lifecare drops it.
  const rows: LifecareCalculationIncomeRaw[] = base.map(row => ({ ...row, amountApplicant: 0, amountCoApplicant: 0 }));
  for (const income of draft.incomes ?? []) {
    const applicant = income.applicantEffectiveAmount ?? 0;
    const coApplicant = income.coapplicantEffectiveAmount ?? 0;
    if (income.deleted || (applicant === 0 && coApplicant === 0)) {
      continue;
    }
    // By name first: careM's own type codes do not always equal Lifecare's incomeCode ("Lön efter skatt").
    const type =
      types.find(candidate => income.typeName !== undefined && sameName(candidate.text, income.typeName)) ??
      types.find(candidate => candidate.id === income.typeId);
    if (!type) {
      unknown.push(income.typeName ?? String(income.typeId));
      continue;
    }
    const existing = rows.find(row => row.incomeCode === type.id);
    if (existing) {
      existing.amountApplicant += applicant;
      existing.amountCoApplicant += coApplicant;
    } else {
      rows.push({
        calculationId,
        serialNumber: 0,
        incomeType: type.text,
        amountApplicant: applicant,
        applicantSearchDate: '',
        applicantNote: null,
        amountCoApplicant: coApplicant,
        coApplicantSearchDate: '',
        grossAmountApplicant: 0,
        grossAmountCoApplicant: 0,
        incomeCode: type.id,
        changeable: true,
        isValid: true,
      });
    }
  }
  return rows;
};

const fillExpenses = (
  base: LifecareCalculationExpenseRaw[],
  draftRows: NormExpenseRow[],
  types: LifecareCalculationTypeRaw[],
  unknown: string[],
): LifecareCalculationExpenseRaw[] => {
  const rows: LifecareCalculationExpenseRaw[] = base.map(row => ({ ...row, appliedAmount: 0, approvedAmount: 0, note: null }));
  for (const expense of draftRows) {
    const approved = effective(expense);
    if (expense.deleted || approved === 0) {
      continue;
    }
    // The draft keeps the cost type as its own code, with Lifecare's label beside it.
    const label = expense.costTypeDisplayName ?? expense.costType ?? '';
    const type = types.find(candidate => sameName(candidate.text, label));
    if (!type) {
      unknown.push(label);
      continue;
    }
    const applied = expense.appliedAmount ?? approved;
    const note = expense.specification ?? expense.note ?? null;
    const existing = rows.find(row => row.expenseCode === type.id);
    if (existing) {
      existing.appliedAmount += applied;
      existing.approvedAmount += approved;
      existing.note = [existing.note, note].filter(Boolean).join('; ') || null;
    } else {
      rows.push({
        expenseCode: type.id,
        expenseType: type.text,
        appliedAmount: applied,
        approvedAmount: approved,
        note,
        changeable: true,
        markForCopy: false,
        showMarkForCopy: false,
      });
    }
  }
  return rows;
};

/**
 * Fills a Lifecare beräkning from the handläggare's draft: the norm, the period, who in the household is
 * included, and every income, utgift and levnadskostnad i övrigt the draft holds. The base is Lifecare's
 * blank underlag for a new beräkning, or the saved one for a change; `household` supplies the members a saved
 * beräkning leaves out (Lifecare keeps only the included). Lifecare places the members on the norm and counts
 * the rest itself.
 *
 * Refused: a draft without a period, a household with a medsökande (how Lifecare takes the medsökandes
 * amounts is not captured), and a row whose type Lifecare's catalogue does not have — sending it without the
 * row would give a beräkning that quietly lacks it.
 */
export const applyDraft = (
  base: LifecareCalculationRaw,
  household: LifecareCalculationPersonRaw[],
  draft: CalculationDraftInput,
  catalogues: LifecareCalculationCataloguesRaw,
  today: string,
): CalculationFill => {
  if (!draft.calculationFromDate || !draft.calculationToDate) {
    return refuse('Normberäkningen saknar period. Fyll i Från och Till.');
  }
  const draftPersons = (draft.persons ?? []).filter(person => !person.deleted);
  if (draftPersons.some(person => person.role === NormPersonRowRoleEnum.CO_APPLICANT && person.included)) {
    return refuse('Hushållet har en medsökande. Sådana normberäkningar kan inte sparas i Lifecare från Drakel ännu.');
  }

  const persons = householdOf(base, household).map((member, index) => {
    const draftPerson = draftPersonFor(member, index, draftPersons);
    if (!draftPerson) {
      return member;
    }
    return {
      ...member,
      included: draftPerson.included ?? false,
      deviationFromDate: draftPerson.deviationFromDate ?? '',
      deviationToDate: draftPerson.deviationToDate ?? '',
    };
  });
  if (!persons.some(person => person.included)) {
    return refuse('Ingen i hushållet ingår i normberäkningen.');
  }

  const unknown: string[] = [];
  const expenseRows = (draft.expenses ?? []).filter(row => row.bucket !== NormExpenseRowBucketEnum.SPECIAL_EXPENSE);
  // The draft keeps levnadskostnader i övrigt in their own list, and marks any in the expenses by bucket.
  const specialRows = [
    ...(draft.expenses ?? []).filter(row => row.bucket === NormExpenseRowBucketEnum.SPECIAL_EXPENSE),
    ...(draft.specialExpenses ?? []),
  ];
  const calculation: LifecareCalculationRaw = {
    ...base,
    normId: catalogues.norms.some(norm => norm.normId === draft.normId) && draft.normId !== undefined ? draft.normId : base.normId,
    date: today,
    startDate: draft.calculationFromDate,
    endDate: draft.calculationToDate,
    calculationPersons: persons,
    calculationIncomes: fillIncomes(base.calculationIncomes, draft, catalogues.incomeTypes, base.calculationId, unknown),
    calculationExpenses: fillExpenses(base.calculationExpenses, expenseRows, catalogues.expenseTypes, unknown),
    calculationSpecialExpenses: fillExpenses(base.calculationSpecialExpenses, specialRows, catalogues.specialExpenseTypes, unknown),
    hasCustomHouseholdSize: draft.hasCustomHouseholdSize ?? false,
  };
  if (unknown.length > 0) {
    return refuse(
      `Lifecare känner inte till: ${[...new Set(unknown)].join(', ')}. Ändra raden i normberäkningen eller för in den direkt i Lifecare.`,
    );
  }
  return { writable: true, calculation };
};

/** The members Lifecare placed on the norm, with their row and amount; the rest are left off the norm. */
export const withPlacedPersons = (calculation: LifecareCalculationRaw, placed: LifecareCalculationPersonRaw[]): LifecareCalculationRaw => ({
  ...calculation,
  calculationPersons: calculation.calculationPersons.map(member => {
    const placement = member.included ? placed.find(candidate => candidate.personId === member.personId) : undefined;
    return placement
      ? { ...member, normRowId: placement.normRowId, normRow: placement.normRow, amount: placement.amount }
      : { ...member, normRowId: 0, normRow: null, amount: 0 };
  }),
});

/**
 * Counts jobbstimulans on the sökandes incomes, the way the web app sends it (capture 2026-09-24): on an
 * income type jobbstimulans applies to, the draft's amount is the gross (`grossAmountApplicant`) and the
 * counted amount is what is left once the type's percent is taken off — "Lön efter skatt" 5 000 at 25 %
 * goes as 5 000 gross and 3 750 counted. Only when Lifecare has marked the sökande as having jobbstimulans
 * in the period; otherwise the whole amount counts.
 */
export const withJobStimulusIncomes = (calculation: LifecareCalculationRaw, types: LifecareCalculationTypeRaw[]): LifecareCalculationRaw => {
  if (calculation.hasApplicantJobStimuli !== true) {
    return calculation;
  }
  return {
    ...calculation,
    calculationIncomes: calculation.calculationIncomes.map(row => {
      const type = types.find(candidate => candidate.id === row.incomeCode);
      if (!type?.isJobStimulus || !type.jobStimulusPercent || row.amountApplicant === 0) {
        return row;
      }
      const gross = row.amountApplicant;
      const counted = Math.round(gross * (100 - type.jobStimulusPercent)) / 100;
      return { ...row, amountApplicant: counted, grossAmountApplicant: gross };
    }),
  };
};

/** The household size as the draft says it — the handläggare's own, or the members included. */
export const householdSizeOf = (calculation: LifecareCalculationRaw, draft: CalculationDraftInput): HouseholdSize => {
  const members = calculation.calculationPersons.filter(person => person.included).length;
  const custom = draft.hasCustomHouseholdSize === true && draft.householdSize !== undefined;
  return { custom, size: custom && draft.householdSize !== undefined ? draft.householdSize : members, members };
};

/** The household size a saved beräkning holds — its own when the handläggare set one, else the members included. */
export const householdSizeOfSaved = (calculation: LifecareCalculationRaw): HouseholdSize => {
  const members = calculation.calculationPersons.filter(person => person.included).length;
  const saved = typeof calculation.householdSize === 'number' ? calculation.householdSize : undefined;
  const custom = calculation.hasCustomHouseholdSize && saved !== undefined;
  return { custom, size: custom && saved !== undefined ? saved : members, members };
};

const subscription = (value: unknown) => ({ da: value, Jb: false, Kb: null, hb: null });

/**
 * A member the way Lifecare's web app sends it: `isValid` and its own subscription fields added, and a member
 * never placed on the norm without a `normRowId` at all (capture 2026-09-24).
 */
const asSentPerson = (person: LifecareCalculationPersonRaw): Record<string, unknown> => {
  const placed = (person.normRowId ?? 0) > 0;
  const { normRowId: _unplaced, ...unplaced } = person;
  const { da: _noRow, ...noRow } = subscription(undefined);
  return {
    ...(placed ? person : unplaced),
    isValid: true,
    normSubscription: placed ? subscription(person.normRowId) : noRow,
    dateSubscriptions: [subscription(''), subscription('')],
    daySubscription: subscription(null),
  };
};

const withHouseholdFields = (body: Record<string, unknown>, household: HouseholdSize): Record<string, unknown> => ({
  ...body,
  HasCustomHouseholdSize: household.custom,
  HouseholdSize: household.size,
  NumberOfFamilyMembers: household.members,
});

/**
 * The `Calculation/Create` body (capture 2026-09-24): the filled underlag with the web app's own additions —
 * members as it sends them, every row marked changeable (and incomes valid), the household size in its
 * PascalCase fields at the end, and the three fields it leaves out of a new beräkning dropped.
 */
export const buildCalculationCreate = (calculation: LifecareCalculationRaw, household: HouseholdSize): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    ...calculation,
    calculationPersons: calculation.calculationPersons.map(asSentPerson),
    calculationIncomes: calculation.calculationIncomes.map(row => ({ ...row, changeable: true, isValid: true })),
    calculationExpenses: calculation.calculationExpenses.map(row => ({ ...row, changeable: true })),
    calculationSpecialExpenses: calculation.calculationSpecialExpenses.map(row => ({ ...row, changeable: true })),
  };
  delete body.aktualiseringId;
  delete body.householdSize;
  delete body.numberOfFamilyMembers;
  return withHouseholdFields(body, household);
};

/**
 * The `Calculation/Update` body (captures 2026-09-24): the saved beräkning as read for edit, with the draft's
 * changes, members as the web app sends them, incomes marked changeable and valid, and the household size
 * both where Lifecare read it and in the PascalCase fields the web app appends. `finalize` saves it as
 * slutlig — the same call with `isFinalized` set, after which Lifecare allows no change.
 */
export const buildCalculationUpdate = (calculation: LifecareCalculationRaw, household: HouseholdSize, finalize = false): Record<string, unknown> =>
  withHouseholdFields(
    {
      ...calculation,
      calculationPersons: calculation.calculationPersons.map(asSentPerson),
      calculationIncomes: calculation.calculationIncomes.map(row => ({ ...row, changeable: true, isValid: true })),
      householdSize: household.size,
      numberOfFamilyMembers: household.members,
      isFinalized: finalize || calculation.isFinalized,
    },
    household,
  );
