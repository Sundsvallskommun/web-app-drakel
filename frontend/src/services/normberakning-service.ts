import {
  NormberakningDraftSourceEnum,
  NormberakningTypes,
  NormberakningTypesApiResponse,
  NormRowOption,
  NormTypeOption,
  PreviousCalculationApiResponse,
  PreviousCalculationView,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** The three editable row sections of the draft normberäkning. */
export type NormSection = 'persons' | 'incomes' | 'expenses';

/**
 * Draft rows mirror the Lifecare FC "Beräkning" view. Defined locally — like {@link Note}. Every value
 * comes as a read-only process value (system), an editable handläggare value, and the effective value
 * (handläggare when set, otherwise process). `origin` = SYSTEM | CASEWORKER.
 */
export interface NormPersonRow {
  id?: string;
  /** Stable 0-based position within the section; rows are kept in this order across refreshes. */
  position?: number;
  origin?: string;
  partyId?: string;
  /** Personnummer resolved from partyId by the BFF; best-effort, so it can be absent. */
  personalNumber?: string;
  /** The machine code; show `roleDisplayName` instead — caremanagement owns the label. */
  role?: 'APPLICANT' | 'CO_APPLICANT' | 'CHILD' | 'VISITATION_CHILD';
  roleDisplayName?: string;
  name?: string;
  processDays?: number;
  caseworkerDays?: number;
  effectiveDays?: number;
  included?: boolean;
  deviationFromDate?: string;
  deviationToDate?: string;
  normInterval?: string;
  /** The member's own share of the norm — the Belopp column; carried over from the previous Lifecare calculation. */
  amount?: number;
  /** The normintervall (norm row) the member is on, when the beräkning is Lifecare's. */
  normRowId?: number;
  deleted?: boolean;
  note?: string;
}

/** One income row per type, with an applicant (S) and co-applicant (M) side. */
export interface NormIncomeRow {
  id?: string;
  /** Stable 0-based position within the section; rows are kept in this order across refreshes. */
  position?: number;
  origin?: string;
  typeId?: number;
  typeName?: string;
  applicantProcessAmount?: number;
  applicantCaseworkerAmount?: number;
  applicantEffectiveAmount?: number;
  applicantAmountDate?: string;
  /** Whether jobbstimulans applies to the sökandes side: the handläggare amount is then the gross (Brutto S). */
  applicantJobStimulus?: boolean;
  /** The sökandes amount Lifecare counts once jobbstimulans is taken off — only on an income it applies to. */
  applicantCountedAmount?: number;
  coapplicantProcessAmount?: number;
  coapplicantCaseworkerAmount?: number;
  coapplicantEffectiveAmount?: number;
  coapplicantAmountDate?: string;
  deleted?: boolean;
  note?: string;
}

/** An expense row; `bucket` separates ordinary expenses (EXPENSE) from special expenses (SPECIAL_EXPENSE). */
export interface NormExpenseRow {
  id?: string;
  /** Stable 0-based position within the section; rows are kept in this order across refreshes. */
  position?: number;
  origin?: string;
  bucket?: 'EXPENSE' | 'SPECIAL_EXPENSE';
  costType?: string;
  /** The Lifecare label for the cost type — the same text a warning about the row uses. */
  costTypeDisplayName?: string;
  otherSubType?: string;
  specification?: string;
  appliedAmount?: number;
  processAmount?: number;
  caseworkerAmount?: number;
  effectiveAmount?: number;
  deleted?: boolean;
  note?: string;
}

export interface NormberakningDraft {
  errandId?: string;
  applicationMonth?: string;
  normId?: number;
  /** The selected norm types as machine codes; show `normTypeDisplayNames` instead. */
  normType?: string[];
  normTypeDisplayNames?: string[];
  calculationFromDate?: string;
  calculationToDate?: string;
  calculationDate?: string;
  hasCustomHouseholdSize?: boolean;
  householdSize?: number;
  persons?: NormPersonRow[];
  incomes?: NormIncomeRow[];
  expenses?: NormExpenseRow[];
  specialExpenses?: NormExpenseRow[];
  incomeSum?: number;
  expenseSum?: number;
  specialExpenseSum?: number;
  created?: string;
  updated?: string;
  /** careM's draft (CAREM) until the beräkning is first saved in Lifecare; Lifecare's beräkning (LIFECARE) after that. */
  source?: NormberakningDraftSourceEnum;
  /** Whether Lifecare holds the beräkning as slutlig — no further change is possible. */
  finalized?: boolean;
  /** The norm's rows a member can be put on — only for a beräkning in Lifecare. */
  normRows?: NormRowOption[];
  /** Whether the sökande has jobbstimulans in the period — the incomes then show Brutto S, as in Lifecare. */
  applicantJobStimulus?: boolean;
  /** Lifecare's gemensamma kostnader for a household of the household size — a beräkning in Lifecare only. */
  amountForHouseholdSize?: number;
  /** The members' share of the gemensamma kostnader (Summa) — a beräkning in Lifecare only. */
  commonHouseholdCost?: number;
  /** How many members the beräkning includes — a beräkning in Lifecare only. */
  familyMembers?: number;
}

/** Fields sent when adding/editing a row (the union of the three sections' inputs). */
export interface NormRowInput {
  typeId?: number;
  typeName?: string;
  applicantCaseworkerAmount?: number;
  applicantAmountDate?: string;
  coapplicantCaseworkerAmount?: number;
  coapplicantAmountDate?: string;
  costType?: string;
  bucket?: string;
  otherSubType?: string;
  specification?: string;
  caseworkerAmount?: number;
  /** The applied (ansökt) amount — only honoured by the API on expense create, not on update. */
  appliedAmount?: number;
  partyId?: string;
  role?: string;
  name?: string;
  caseworkerDays?: number;
  included?: boolean;
  deviationFromDate?: string;
  deviationToDate?: string;
  normInterval?: string;
  /** The normintervall (norm row) to put a member of a beräkning in Lifecare on. */
  normRowId?: number;
  note?: string;
}

/**
 * Fields sent when editing the header. Gemensamma kostnader sends the household size; once the beräkning is
 * in Lifecare that is all that can be changed.
 */
export interface NormHeaderInput {
  normId?: number;
  normType?: string[];
  calculationFromDate?: string;
  calculationToDate?: string;
  calculationDate?: string;
  hasCustomHouseholdSize?: boolean;
  householdSize?: number;
}

type NormRow = NormPersonRow | NormIncomeRow | NormExpenseRow;

/** A selectable income/cost type — the code stored on the row plus its Swedish display label. */
export type TypeOption = NormTypeOption;

/**
 * The income/cost types a new row on the errand's normberäkning can have: careM's catalogues until the
 * beräkning is saved in Lifecare, Lifecare's own after that.
 */
export const getNormberakningTypes = (errandId: string): Promise<ServiceResponse<NormberakningTypes>> =>
  apiService
    .get<NormberakningTypesApiResponse>(`errands/${errandId}/normberakning/types`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

const byPosition = (first: { position?: number }, second: { position?: number }): number =>
  (first.position ?? 0) - (second.position ?? 0);

/**
 * Orders each editable section by the server-assigned, stable `position` so rows keep their place across
 * refreshes (caremanagement already returns them sorted; we sort defensively to make the order explicit).
 */
const sortDraftRows = (draft?: NormberakningDraft): NormberakningDraft | undefined =>
  !draft ? draft : (
    {
      ...draft,
      persons: draft.persons ? [...draft.persons].sort(byPosition) : draft.persons,
      incomes: draft.incomes ? [...draft.incomes].sort(byPosition) : draft.incomes,
      expenses: draft.expenses ? [...draft.expenses].sort(byPosition) : draft.expenses,
      specialExpenses: draft.specialExpenses ? [...draft.specialExpenses].sort(byPosition) : draft.specialExpenses,
    }
  );

/** Fetches the Lifecare-aligned draft normberäkning for an errand. */
export const getNormberakningDraft = (errandId: string): Promise<ServiceResponse<NormberakningDraft>> =>
  apiService
    .get<ApiResponse<NormberakningDraft>>(`errands/${errandId}/normberakning/draft`)
    .then((res) => ({ data: sortDraftRows(res.data.data) }))
    .catch(toServiceError);

/** Adds a handläggare row to a section. */
export const addNormRow = (
  errandId: string,
  section: NormSection,
  input: NormRowInput
): Promise<ServiceResponse<NormRow>> =>
  apiService
    .post<ApiResponse<NormRow>>(`errands/${errandId}/normberakning/draft/${section}`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Sets the handläggare value(s)/note on a row. */
export const updateNormRow = (
  errandId: string,
  section: NormSection,
  rowId: string,
  input: NormRowInput
): Promise<ServiceResponse<NormRow>> =>
  apiService
    .patch<ApiResponse<NormRow>>(`errands/${errandId}/normberakning/draft/${section}/${rowId}`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Soft-deletes a row. */
export const deleteNormRow = (
  errandId: string,
  section: NormSection,
  rowId: string
): Promise<ServiceResponse<NormRow>> =>
  apiService
    .delete<ApiResponse<NormRow>>(`errands/${errandId}/normberakning/draft/${section}/${rowId}`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Restores a soft-deleted row. */
export const restoreNormRow = (
  errandId: string,
  section: NormSection,
  rowId: string
): Promise<ServiceResponse<NormRow>> =>
  apiService
    .post<ApiResponse<NormRow>>(`errands/${errandId}/normberakning/draft/${section}/${rowId}/restore`, {})
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Updates the header — the household size from Gemensamma kostnader; in Lifecare once the beräkning is there. */
export const updateNormHeader = (
  errandId: string,
  input: NormHeaderInput
): Promise<ServiceResponse<NormberakningDraft>> =>
  apiService
    .patch<ApiResponse<NormberakningDraft>>(`errands/${errandId}/normberakning/draft/header`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/**
 * The beräkning preceding the errand's own period, read from Lifecare. Read-only — the values Lifecare
 * settled on. Resolves to `null` when the applicant has no earlier beräkning, which is a normal state
 * rather than an error.
 */
export const getPreviousNormberakning = (errandId: string): Promise<ServiceResponse<PreviousCalculationView | null>> =>
  apiService
    .get<PreviousCalculationApiResponse>(`errands/${errandId}/normberakning/previous`)
    .then((res) => ({ data: res.data.data ?? null }))
    .catch(toServiceError);
