import { HttpException } from '@exceptions/HttpException';
import {
  LifecareCalculationExpenseRaw,
  LifecareCalculationForEditRaw,
  LifecareCalculationIncomeRaw,
  LifecareCalculationPersonRaw,
  LifecareCalculationRaw,
  LifecareCalculationTypeRaw,
} from '@interfaces/lifecare-calculation.interface';

import { NormRowInputDto } from '@/dtos/normberakning.dto';
import { NormberakningDraft, NormExpenseRow, NormIncomeRow, NormPersonRow } from '@/responses/normberakning.response';

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

const toPersonRow = (person: LifecareCalculationPersonRaw, index: number): NormPersonRow => ({
  id: personRowId(person, index),
  position: index,
  origin: CASEWORKER_ORIGIN,
  personalNumber: person.personIdFormatted,
  name: person.name,
  included: person.included,
  amount: person.amount,
  deviationFromDate: dateOrUndefined(person.deviationFromDate),
  deviationToDate: dateOrUndefined(person.deviationToDate),
  effectiveDays: typeof person.deviationDays === 'number' ? person.deviationDays : undefined,
  normInterval: person.normRow ?? undefined,
});

const toIncomeRow = (row: LifecareCalculationIncomeRaw, index: number, types: LifecareCalculationTypeRaw[]): NormIncomeRow => {
  const applicant = enteredApplicantAmount(row, types);
  return {
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
    persons: calculation.calculationPersons.map(toPersonRow),
    incomes: calculation.calculationIncomes.filter(keepsIncome).map((row, index) => toIncomeRow(row, index, forEdit.incomeTypes)),
    expenses: toExpenseRows(calculation.calculationExpenses, 'EXPENSE'),
    specialExpenses: toExpenseRows(calculation.calculationSpecialExpenses, 'SPECIAL_EXPENSE'),
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

/** Sets whether the member `rowId` is in the beräkning, and the dates it is in the household (Ingår från/till). */
export const changePerson = (calculation: LifecareCalculationRaw, rowId: string, input: NormRowInputDto): LifecareCalculationRaw => {
  const index = personIndexOf(calculation, rowId);
  return {
    ...calculation,
    calculationPersons: calculation.calculationPersons.map((person, position) =>
      position === index
        ? {
            ...person,
            included: input.included ?? person.included,
            deviationFromDate: toLifecareDay(input.deviationFromDate),
            deviationToDate: toLifecareDay(input.deviationToDate),
          }
        : person,
    ),
  };
};

/** Takes the member `rowId` out of the beräkning. The sökande — the first member — stays. */
export const removePerson = (calculation: LifecareCalculationRaw, rowId: string): LifecareCalculationRaw => {
  const index = personIndexOf(calculation, rowId);
  if (index === 0) {
    throw new HttpException(422, 'Sökanden kan inte tas bort ur normberäkningen.');
  }
  return { ...calculation, calculationPersons: calculation.calculationPersons.filter((_person, position) => position !== index) };
};

/**
 * Takes a person into the beräkning — the row `GetProposalForPerson` gave, included, and marked as a bonusbarn
 * the way the web app marks one (capture 2026-09-24).
 */
export const addPerson = (calculation: LifecareCalculationRaw, person: LifecareCalculationPersonRaw, bonusChild: boolean): LifecareCalculationRaw => {
  if (calculation.calculationPersons.some(present => present.personId === person.personId)) {
    throw new HttpException(422, `${person.name} finns redan i normberäkningen.`);
  }
  return {
    ...calculation,
    calculationPersons: [...calculation.calculationPersons, { ...person, included: true, isBonusChild: bonusChild ? true : '', deviationDays: '' }],
  };
};
