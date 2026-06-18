import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** The three editable sections of the draft normberäkning. */
export type NormSection = 'persons' | 'incomes' | 'expenses';

/**
 * Draft rows. Defined locally — like {@link Note} — mirroring the backend response. Every row carries a
 * read-only process value (system-set), an editable handläggare value, and the resulting effective
 * value (handläggare when set, otherwise process). `origin` = SYSTEM | HANDLAGGARE.
 */
export interface NormPersonRow {
  id?: string;
  origin?: string;
  partyId?: string;
  role?: 'APPLICANT' | 'CO_APPLICANT' | 'CHILD';
  name?: string;
  processDays?: number;
  handlaggareDays?: number;
  effectiveDays?: number;
  deleted?: boolean;
  note?: string;
}

export interface NormIncomeRow {
  id?: string;
  origin?: string;
  typeId?: number;
  typeName?: string;
  recipient?: 'APPLICANT' | 'CO_APPLICANT';
  processAmount?: number;
  processAmountDate?: string;
  handlaggareAmount?: number;
  handlaggareAmountDate?: string;
  effectiveAmount?: number;
  deleted?: boolean;
  note?: string;
}

export interface NormExpenseRow {
  id?: string;
  origin?: string;
  costType?: string;
  otherSubType?: string;
  specification?: string;
  appliedAmount?: number;
  processAmount?: number;
  handlaggareAmount?: number;
  effectiveAmount?: number;
  deleted?: boolean;
  note?: string;
}

export interface NormberakningDraft {
  errandId?: string;
  applicationMonth?: string;
  normId?: number;
  normType?: string;
  persons?: NormPersonRow[];
  incomes?: NormIncomeRow[];
  expenses?: NormExpenseRow[];
  incomeSum?: number;
  expenseSum?: number;
  created?: string;
  updated?: string;
}

/** Fields sent when adding/editing a row (the union of the three sections' inputs). */
export interface NormRowInput {
  typeId?: number;
  typeName?: string;
  recipient?: string;
  handlaggareAmount?: number;
  handlaggareAmountDate?: string;
  costType?: string;
  otherSubType?: string;
  specification?: string;
  partyId?: string;
  role?: string;
  name?: string;
  handlaggareDays?: number;
  note?: string;
}

type NormRow = NormPersonRow | NormIncomeRow | NormExpenseRow;

/** Fetches the three-section draft normberäkning for an errand. */
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

/** Sets the handläggare value/note on a row. */
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
