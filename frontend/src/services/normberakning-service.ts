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
  origin?: string;
  partyId?: string;
  role?: 'APPLICANT' | 'CO_APPLICANT' | 'CHILD' | 'VISITATION_CHILD';
  name?: string;
  processDays?: number;
  caseworkerDays?: number;
  effectiveDays?: number;
  included?: boolean;
  deviationFromDate?: string;
  deviationToDate?: string;
  normInterval?: string;
  jobStimulusAmount?: number;
  deleted?: boolean;
  note?: string;
}

/** One income row per type, with an applicant (S) and co-applicant (M) side. */
export interface NormIncomeRow {
  id?: string;
  origin?: string;
  typeId?: number;
  typeName?: string;
  applicantProcessAmount?: number;
  applicantCaseworkerAmount?: number;
  applicantEffectiveAmount?: number;
  applicantAmountDate?: string;
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
  origin?: string;
  bucket?: 'EXPENSE' | 'SPECIAL_EXPENSE';
  costType?: string;
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
  normType?: string;
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
  partyId?: string;
  role?: string;
  name?: string;
  caseworkerDays?: number;
  included?: boolean;
  deviationFromDate?: string;
  deviationToDate?: string;
  normInterval?: string;
  jobStimulusAmount?: number;
  note?: string;
}

/**
 * Fields sent when editing the draft header (norm, calculation dates, household size).
 * @public — header editing is not wired into the UI yet (the header is read-only for now).
 */
export interface NormHeaderInput {
  normId?: number;
  normType?: string;
  calculationFromDate?: string;
  calculationToDate?: string;
  calculationDate?: string;
  hasCustomHouseholdSize?: boolean;
  householdSize?: number;
}

type NormRow = NormPersonRow | NormIncomeRow | NormExpenseRow;

/** Fetches the Lifecare-aligned draft normberäkning for an errand. */
export const getNormberakningDraft = (errandId: string): Promise<ServiceResponse<NormberakningDraft>> =>
  apiService
    .get<ApiResponse<NormberakningDraft>>(`errands/${errandId}/normberakning/draft`)
    .then((res) => ({ data: res.data.data }))
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

/**
 * Updates the draft header (norm, calculation dates, household size).
 * @public — not wired into the UI yet (the header is read-only for now).
 */
export const updateNormHeader = (
  errandId: string,
  input: NormHeaderInput
): Promise<ServiceResponse<NormberakningDraft>> =>
  apiService
    .patch<ApiResponse<NormberakningDraft>>(`errands/${errandId}/normberakning/draft/header`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
