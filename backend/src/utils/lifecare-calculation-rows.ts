import { HttpException } from '@exceptions/HttpException';
import {
  LifecareCalculationExpenseRaw,
  LifecareCalculationForEditRaw,
  LifecareCalculationIncomeRaw,
  LifecareCalculationPersonRaw,
  LifecareCalculationRaw,
  LifecareCalculationTypeRaw,
  LifecareNormSharedRaw,
} from '@interfaces/lifecare-calculation.interface';

import { NormHeaderInputDto, NormRowInputDto } from '@/dtos/normberakning.dto';
import { NormberakningDraft, NormExpenseRow, NormIncomeRow, NormPersonRow, NormRowOption } from '@/responses/normberakning.response';

/**
 * A beräkning saved in Lifecare, shown and edited in the shape of careM's draft so the Normberäkning tab
 * works the same before and after the first save. Lifecare has no process values, soft delete or row ids:
 * the value is the handläggare's, a removed row goes to 0 (Lifecare drops it), and rows are named by their
 * type — an income by its code, an utgift by its bucket and code.
 */

type ExpenseBucket = 'EXPENSE' | 'SPECIAL_EXPENSE';

const BUCKET_PREFIX: Record<ExpenseBucket, string> = { EXPENSE: 'E', SPECIAL_EXPENSE: 'S' };

// Every row the tab edits in Lifecare is the handläggare's own.
const CASEWORKER_ORIGIN = 'CASEWORKER';

/** A row Lifecare keeps: one it would drop — every amount 0 — is not shown. */
const keepsIncome = (row: LifecareCalculationIncomeRaw): boolean => row.amountApplicant !== 0 || row.amountCoApplicant !== 0;
const keepsExpense = (row: LifecareCalculationExpenseRaw): boolean => row.appliedAmount !== 0 || row.approvedAmount !== 0;

/** Lifecare leaves an unset date empty; the view leaves it out. */
const dateOrUndefined = (value: string | null | undefined): string | undefined => (value === '' || value === null ? undefined : value);

/** The day of a date or date-time, as Lifecare stores it; empty when there is none. */
const toLifecareDay = (value: string | undefined): string => (value ? value.slice(0, 10) : '');

const findType = (types: LifecareCalculationTypeRaw[], code: number): LifecareCalculationTypeRaw | undefined => types.find(type => type.id === code);

/**
 * The sökandes amount as the handläggare entered it. On an income jobbstimulans applies to, Lifecare keeps the
 * counted amount and the gross beside it; the handläggare works with the gross.
 */
const enteredApplicantAmount = (row: LifecareCalculationIncomeRaw, types: LifecareCalculationTypeRaw[]): number => {
  const gross = typeof row.grossAmountApplicant === 'number' ? row.grossAmountApplicant : 0;
  return findType(types, row.incomeCode)?.isJobStimulus && gross > 0 ? gross : row.amountApplicant;
};

/** An expense row's id: its bucket and code, with the occurrence when the code repeats (`E-3`, `E-3-2`). */
const expenseRowIds = (rows: LifecareCalculationExpenseRaw[], bucket: ExpenseBucket): string[] => {
  const seen = new Map<number, number>();
  return rows.map(row => {
    const occurrence = (seen.get(row.expenseCode) ?? 0) + 1;
    seen.set(row.expenseCode, occurrence);
    const id = `${BUCKET_PREFIX[bucket]}-${String(row.expenseCode)}`;
    return occurrence === 1 ? id : `${id}-${String(occurrence)}`;
  });
};

/** A member's id on the beräkning: Lifecare's personKey, or its place for one not saved yet. */
const personRowId = (person: LifecareCalculationPersonRaw, index: number): string =>
  typeof person.personKey === 'number' && person.personKey > 0 ? String(person.personKey) : `new-${String(index + 1)}`;

// Under this age a member is a barn in the household.
const ADULT_AGE = 18;

/** Whether the member is under 18 on the day — from Lifecare's birth date, `yyyy-MM-dd`. */
const isMinorOn = (birthDate: unknown, day: string): boolean => {
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || day === '') {
    return false;
  }
  const adultOn = `${String(Number(birthDate.slice(0, 4)) + ADULT_AGE)}${birthDate.slice(4)}`;
  return adultOn > day;
};

/**
 * The member's role the way careM's draft names it. Lifecare has no roles on a beräkning: the first member is
 * the sökande, a bonusbarn is counted as an umgängesbarn, and anyone else under 18 at the start of the period
 * as a barn.
 */
const roleOf = (person: LifecareCalculationPersonRaw, index: number, periodStart: string): NormPersonRow['role'] => {
  if (index === 0) {
    return 'APPLICANT';
  }
  if (person.isBonusChild === true) {
    return 'VISITATION_CHILD';
  }
  return isMinorOn(person.birthDate, periodStart) ? 'CHILD' : undefined;
};

const toPersonRow = (person: LifecareCalculationPersonRaw, index: number, periodStart: string): NormPersonRow => ({
  id: personRowId(person, index),
  role: roleOf(person, index, periodStart),
  position: index,
  origin: CASEWORKER_ORIGIN,
  personalNumber: person.personIdFormatted,
  name: person.name,
  included: person.included,
  amount: person.amount,
  deviationFromDate: dateOrUndefined(person.deviationFromDate),
  deviationToDate: dateOrUndefined(person.deviationToDate),
  effectiveDays: typeof person.deviationDays === 'number' ? person.deviationDays : undefined,
  caseworkerDays: typeof person.deviationDays === 'number' ? person.deviationDays : undefined,
  normRowId: (person.normRowId ?? 0) > 0 ? person.normRowId : undefined,
  normInterval: person.normRow ?? undefined,
});

/** A norm row the way Lifecare's list names it: its name and monthly amount — "Make/maka/sambo 3550.00". */
const normRowLabel = (row: { name: string; monthlyAmount?: number }): string =>
  typeof row.monthlyAmount === 'number' && !/\d+[.,]\d{2}$/.test(row.name) ? `${row.name} ${row.monthlyAmount.toFixed(2)}` : row.name;

/** The norm's rows as the tab offers them for Normintervall/Belopp. */
const toNormRowOptions = (calculation: LifecareCalculationRaw): NormRowOption[] =>
  (calculation.norm?.rows ?? []).map(row => ({ id: row.rowId, name: normRowLabel(row) }));

/**
 * An income as the tab shows it. When the sökande has jobbstimulans in the period, an income it applies to is
 * entered as a gross (Brutto S) and Lifecare counts the amount (Belopp S) from it, as in Lifecare's own view.
 */
const toIncomeRow = (
  row: LifecareCalculationIncomeRaw,
  index: number,
  types: LifecareCalculationTypeRaw[],
  applicantHasJobStimulus: boolean,
): NormIncomeRow => {
  const applicant = enteredApplicantAmount(row, types);
  const jobStimulusApplies = applicantHasJobStimulus && findType(types, row.incomeCode)?.isJobStimulus === true;
  return {
    ...(jobStimulusApplies ? { applicantJobStimulus: true, applicantCountedAmount: row.amountApplicant } : {}),
    id: String(row.incomeCode),
    position: index,
    origin: CASEWORKER_ORIGIN,
    typeId: row.incomeCode,
    typeName: row.incomeType,
    applicantCaseworkerAmount: applicant,
    applicantEffectiveAmount: applicant,
    applicantAmountDate: dateOrUndefined(row.applicantSearchDate),
    coapplicantCaseworkerAmount: row.amountCoApplicant,
    coapplicantEffectiveAmount: row.amountCoApplicant,
    coapplicantAmountDate: dateOrUndefined(row.coApplicantSearchDate),
    note: typeof row.applicantNote === 'string' && row.applicantNote !== '' ? row.applicantNote : undefined,
  };
};

/** The rows Lifecare keeps, named the way changeExpense finds them again — counted over the whole list. */
const toExpenseRows = (rows: LifecareCalculationExpenseRaw[], bucket: ExpenseBucket): NormExpenseRow[] => {
  const ids = expenseRowIds(rows, bucket);
  return rows
    .map((row, index) => ({ row, id: ids[index] }))
    .filter(({ row }) => keepsExpense(row))
    .map(({ row, id }, index) => ({
      id,
      position: index,
      origin: CASEWORKER_ORIGIN,
      bucket,
      costType: String(row.expenseCode),
      costTypeDisplayName: row.expenseType,
      appliedAmount: row.appliedAmount,
      caseworkerAmount: row.approvedAmount,
      effectiveAmount: row.approvedAmount,
      note: dateOrUndefined(row.note),
    }));
};

/** The saved beräkning as the tab's draft view, marked as Lifecare's. */
export const toLifecareDraftView = (forEdit: LifecareCalculationForEditRaw, applicationMonth: string | undefined): NormberakningDraft => {
  const { calculation } = forEdit;
  return {
    applicationMonth,
    normId: calculation.normId,
    normTypeDisplayNames: calculation.normText ? [calculation.normText] : [],
    calculationFromDate: dateOrUndefined(calculation.startDate),
    calculationToDate: dateOrUndefined(calculation.endDate),
    calculationDate: dateOrUndefined(calculation.date),
    hasCustomHouseholdSize: calculation.hasCustomHouseholdSize,
    householdSize: typeof calculation.householdSize === 'number' ? calculation.householdSize : undefined,
    persons: calculation.calculationPersons.map((person, index) => toPersonRow(person, index, calculation.startDate)),
    applicantJobStimulus: calculation.hasApplicantJobStimuli === true,
    incomes: calculation.calculationIncomes
      .filter(keepsIncome)
      .map((row, index) => toIncomeRow(row, index, forEdit.incomeTypes, calculation.hasApplicantJobStimuli === true)),
    expenses: toExpenseRows(calculation.calculationExpenses, 'EXPENSE'),
    specialExpenses: toExpenseRows(calculation.calculationSpecialExpenses, 'SPECIAL_EXPENSE'),
    normRows: toNormRowOptions(calculation),
    amountForHouseholdSize: calculation.amountForHouseholdSize,
    commonHouseholdCost: calculation.commonHouseholdCost,
    familyMembers: calculation.calculationPersons.filter(person => person.included).length,
    incomeSum: calculation.sumInk,
    expenseSum: calculation.sumUtg,
    specialExpenseSum: calculation.sumSpec,
    updated: dateOrUndefined(calculation.updateTimestamp),
    source: 'LIFECARE',
    finalized: calculation.isFinalized,
  };
};

/**
 * Puts the gross back as the sökandes amount on every income jobbstimulans applies to, so a change starts
 * from what the handläggare entered — `withJobStimulusIncomes` then counts it again, instead of taking the
 * percent off an amount it was already taken off.
 */
export const withEnteredIncomes = (calculation: LifecareCalculationRaw, types: LifecareCalculationTypeRaw[]): LifecareCalculationRaw => ({
  ...calculation,
  calculationIncomes: calculation.calculationIncomes.map(row => ({ ...row, amountApplicant: enteredApplicantAmount(row, types) })),
});

const notFound = (): HttpException => new HttpException(404, 'Raden finns inte längre i normberäkningen. Ladda om fliken.');

/**
 * The income fields the handläggare sets, as Lifecare names them. The tab always sends the whole row, so a
 * field left out is empty. The sökandes amount goes as both counted and gross; for an income jobbstimulans
 * applies to, `withJobStimulusIncomes` counts it down afterwards.
 */
const incomeFields = (input: NormRowInputDto): Partial<LifecareCalculationIncomeRaw> => ({
  amountApplicant: input.applicantCaseworkerAmount ?? 0,
  grossAmountApplicant: input.applicantCaseworkerAmount ?? 0,
  applicantSearchDate: toLifecareDay(input.applicantAmountDate),
  amountCoApplicant: input.coapplicantCaseworkerAmount ?? 0,
  coApplicantSearchDate: toLifecareDay(input.coapplicantAmountDate),
  applicantNote: input.note ?? null,
});

/** Adds an income of a type from Lifecare's catalogue, picked by code or name. A type already on the beräkning is changed there. */
export const addIncome = (
  calculation: LifecareCalculationRaw,
  types: LifecareCalculationTypeRaw[],
  input: NormRowInputDto,
): LifecareCalculationRaw => {
  const type = types.find(candidate => candidate.id === input.typeId || (input.typeName !== undefined && candidate.text === input.typeName));
  if (!type) {
    throw new HttpException(422, `Lifecare har ingen inkomsttyp "${input.typeName ?? String(input.typeId)}".`);
  }
  if (calculation.calculationIncomes.some(row => row.incomeCode === type.id && keepsIncome(row))) {
    throw new HttpException(422, `${type.text} finns redan i normberäkningen. Ändra den raden i stället.`);
  }
  const others = calculation.calculationIncomes.filter(row => row.incomeCode !== type.id);
  return {
    ...calculation,
    calculationIncomes: [
      ...others,
      {
        calculationId: calculation.calculationId,
        serialNumber: 0,
        incomeType: type.text,
        amountApplicant: 0,
        applicantSearchDate: '',
        applicantNote: null,
        amountCoApplicant: 0,
        coApplicantSearchDate: '',
        grossAmountApplicant: 0,
        grossAmountCoApplicant: 0,
        incomeCode: type.id,
        changeable: true,
        isValid: true,
        ...incomeFields(input),
      },
    ],
  };
};

/** Changes the income row `rowId` (its income code). */
export const changeIncome = (calculation: LifecareCalculationRaw, rowId: string, input: NormRowInputDto): LifecareCalculationRaw => {
  if (!calculation.calculationIncomes.some(row => String(row.incomeCode) === rowId)) {
    throw notFound();
  }
  return {
    ...calculation,
    calculationIncomes: calculation.calculationIncomes.map(row => (String(row.incomeCode) === rowId ? { ...row, ...incomeFields(input) } : row)),
  };
};

/** Removes the income row `rowId`: its amounts go to 0 and Lifecare drops it on save. */
export const removeIncome = (calculation: LifecareCalculationRaw, rowId: string): LifecareCalculationRaw => changeIncome(calculation, rowId, {});

const bucketOfRow = (rowId: string): ExpenseBucket | undefined =>
  rowId.startsWith(`${BUCKET_PREFIX.EXPENSE}-`) ? 'EXPENSE' : rowId.startsWith(`${BUCKET_PREFIX.SPECIAL_EXPENSE}-`) ? 'SPECIAL_EXPENSE' : undefined;

const expenseListOf = (bucket: ExpenseBucket): 'calculationExpenses' | 'calculationSpecialExpenses' =>
  bucket === 'EXPENSE' ? 'calculationExpenses' : 'calculationSpecialExpenses';

/** Adds an utgift or a levnadskostnad i övrigt (`input.bucket`) of a type from Lifecare's catalogue, picked by code. */
export const addExpense = (
  calculation: LifecareCalculationRaw,
  forEdit: LifecareCalculationForEditRaw,
  input: NormRowInputDto,
): LifecareCalculationRaw => {
  const bucket: ExpenseBucket = input.bucket === 'SPECIAL_EXPENSE' ? 'SPECIAL_EXPENSE' : 'EXPENSE';
  const types = bucket === 'EXPENSE' ? forEdit.expenseTypes : forEdit.specialExpenseTypes;
  const type = types.find(candidate => String(candidate.id) === input.costType);
  if (!type) {
    throw new HttpException(422, `Lifecare har ingen kostnadstyp "${input.costType ?? ''}".`);
  }
  const approved = input.caseworkerAmount ?? input.appliedAmount ?? 0;
  const list = expenseListOf(bucket);
  return {
    ...calculation,
    [list]: [
      ...calculation[list],
      {
        expenseCode: type.id,
        expenseType: type.text,
        appliedAmount: input.appliedAmount ?? approved,
        approvedAmount: approved,
        note: input.note ?? null,
        changeable: true,
        markForCopy: false,
        showMarkForCopy: false,
      },
    ],
  };
};

/** Changes the expense row `rowId` (see expenseRowIds). */
export const changeExpense = (calculation: LifecareCalculationRaw, rowId: string, input: NormRowInputDto): LifecareCalculationRaw => {
  const bucket = bucketOfRow(rowId);
  if (!bucket) {
    throw notFound();
  }
  const list = expenseListOf(bucket);
  const ids = expenseRowIds(calculation[list], bucket);
  const index = ids.indexOf(rowId);
  if (index < 0) {
    throw notFound();
  }
  return {
    ...calculation,
    [list]: calculation[list].map((row, position) =>
      position === index
        ? {
            ...row,
            appliedAmount: input.appliedAmount ?? row.appliedAmount,
            approvedAmount: input.caseworkerAmount ?? 0,
            note: input.note ?? null,
          }
        : row,
    ),
  };
};

/** Removes the expense row `rowId`: its amounts go to 0 and Lifecare drops it on save. */
export const removeExpense = (calculation: LifecareCalculationRaw, rowId: string): LifecareCalculationRaw =>
  changeExpense(calculation, rowId, { appliedAmount: 0, caseworkerAmount: 0 });

const personIndexOf = (calculation: LifecareCalculationRaw, rowId: string): number => {
  const index = calculation.calculationPersons.findIndex((person, position) => personRowId(person, position) === rowId);
  if (index < 0) {
    throw notFound();
  }
  return index;
};

/** A normintervall's name as a member carries it: the row's name without its amount — "Ensamstående". */
const normRowName = (name: string): string => name.replace(/\s+\d+(?:[.,]\d+)?$/, '').trim();

/**
 * Sets the member `rowId`'s days in the household and normintervall. No days means the whole period. The
 * amount is Lifecare's to count from these (see LifecareCalculationEditService); Ingår från/till stay as
 * Lifecare has them.
 */
export const changePerson = (calculation: LifecareCalculationRaw, rowId: string, input: NormRowInputDto): LifecareCalculationRaw => {
  const index = personIndexOf(calculation, rowId);
  const row = input.normRowId === undefined ? undefined : calculation.norm?.rows?.find(candidate => candidate.rowId === input.normRowId);
  if (input.normRowId !== undefined && !row) {
    throw new HttpException(422, 'Normintervallet finns inte i normen. Ladda om fliken.');
  }
  return {
    ...calculation,
    calculationPersons: calculation.calculationPersons.map((person, position) =>
      position === index
        ? {
            ...person,
            deviationDays: input.caseworkerDays ?? null,
            ...(row ? { normRowId: row.rowId, normRow: normRowName(row.name) } : {}),
          }
        : person,
    ),
  };
};

/**
 * Whether a member already on the beräkning has other days or another normintervall than before — its amount
 * then has to be counted again. A member just taken in has the amount Lifecare placed it with.
 */
export const needsRecount = (before: LifecareCalculationRaw, member: LifecareCalculationPersonRaw): boolean => {
  const previous = before.calculationPersons.find(candidate => candidate.personId === member.personId);
  return (
    previous !== undefined &&
    member.included &&
    (member.normRowId ?? 0) > 0 &&
    (previous.normRowId !== member.normRowId || (previous.deviationDays ?? null) !== (member.deviationDays ?? null))
  );
};

/** Takes the member `rowId` out of the beräkning. The sökande — the first member — stays. */
export const removePerson = (calculation: LifecareCalculationRaw, rowId: string): LifecareCalculationRaw => {
  const index = personIndexOf(calculation, rowId);
  if (index === 0) {
    throw new HttpException(422, 'Sökanden kan inte tas bort ur normberäkningen.');
  }
  return { ...calculation, calculationPersons: calculation.calculationPersons.filter((_person, position) => position !== index) };
};

/** Puts the beräkning on another of Lifecare's norms, every member taken off the old norm's rows. */
const changeNorm = (calculation: LifecareCalculationRaw, forEdit: LifecareCalculationForEditRaw, normId: number): LifecareCalculationRaw => {
  const norm = forEdit.norms.find(candidate => candidate.normId === normId);
  if (!norm) {
    throw new HttpException(422, 'Normen finns inte i Lifecare. Ladda om fliken.');
  }
  return {
    ...calculation,
    normId: norm.normId,
    normText: norm.name,
    calculationPersons: calculation.calculationPersons.map(person => ({ ...person, normRowId: 0, normRow: null, amount: 0 })),
  };
};

/**
 * Changes the beräkning's header from Drakel: its norm, and its own household size (Annan hushållsstorlek) or
 * taking that off so the members count. The period is Lifecare's.
 *
 * A new norm has its own rows, so every member is taken off the old one's normintervall — Lifecare places them
 * on the new norm when the beräkning is saved. An own household size is saved for the household's coming
 * beräkningar too — the web app's "Vill du spara och använda annan hushållsstorlek för hushållet kommande
 * beräkningar?" answered Ja.
 */
export const changeHeader = (
  calculation: LifecareCalculationRaw,
  forEdit: LifecareCalculationForEditRaw,
  input: NormHeaderInputDto,
): LifecareCalculationRaw => {
  if (input.normType !== undefined || input.calculationFromDate !== undefined || input.calculationToDate !== undefined) {
    throw new HttpException(422, 'Perioden ändras i Lifecare. Från Drakel går normen och hushållsstorleken att ändra.');
  }
  const withNorm = input.normId === undefined || input.normId === calculation.normId ? calculation : changeNorm(calculation, forEdit, input.normId);
  if (input.hasCustomHouseholdSize === undefined && input.householdSize === undefined) {
    return withNorm;
  }
  const custom = input.hasCustomHouseholdSize ?? withNorm.hasCustomHouseholdSize;
  if (custom && (input.householdSize === undefined || input.householdSize < 1)) {
    throw new HttpException(422, 'Ange hushållsstorleken.');
  }
  return {
    ...withNorm,
    hasCustomHouseholdSize: custom,
    householdSize: custom ? input.householdSize : withNorm.calculationPersons.filter(person => person.included).length,
    saveHouseholdSize: custom,
  };
};

/** The household size the gemensamma kostnader are counted on: the own size when there is one, else the members. */
const sharedSizeOf = (calculation: LifecareCalculationRaw): { size: number; members: number } => {
  const members = calculation.calculationPersons.filter(person => person.included).length;
  const own = typeof calculation.householdSize === 'number' ? calculation.householdSize : 0;
  return { size: calculation.hasCustomHouseholdSize && own > 0 ? own : members, members };
};

/** Whether the norm, the household size or the members counted changed — the gemensamma kostnader then change too. */
export const householdSizeChanged = (before: LifecareCalculationRaw, after: LifecareCalculationRaw): boolean => {
  const previous = sharedSizeOf(before);
  const next = sharedSizeOf(after);
  return before.normId !== after.normId || previous.size !== next.size || previous.members !== next.members;
};

/**
 * The gemensamma kostnader for the household, from what Lifecare counts for a household of its size: the
 * members' share of it — the amount × members ÷ household size (captures 2026-09-24: 2 030 × 3/4 = 1 523,
 * 13 980 × 1/5 = 2 796). Undefined when the norm has no row for that size.
 */
export const sharedCostShare = (
  calculation: LifecareCalculationRaw,
): { normShared: LifecareNormSharedRaw; share: (amount: number) => number } | undefined => {
  const { size, members } = sharedSizeOf(calculation);
  const normShared = calculation.norm?.shared?.find(row => row.noOfMembers === size);
  if (!normShared || size === 0) {
    return undefined;
  }
  return { normShared, share: amount => Math.round((amount * members) / size) };
};
