import {
  NormberakningDraft,
  NormberakningDraftApiResponse,
  NormberakningTypes,
  NormberakningTypesApiResponse,
  NormExpenseRow,
  NormHeaderInputDto,
  NormIncomeRow,
  NormPersonRow,
  NormRowInputDto,
  NormTypeOption,
  PreviousCalculationApiResponse,
  PreviousCalculationView,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, mapData, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/** The three editable row sections of the draft normberäkning. */
export type NormSection = 'persons' | 'incomes' | 'expenses';

/**
 * Draft rows mirror the Lifecare FC "Beräkning" view. Every value comes as a read-only process value (system), an
 * editable handläggare value, and the effective value (handläggare when set, otherwise process); `origin` is SYSTEM
 * or CASEWORKER and `position` the stable place in the section. Persons show `roleDisplayName`, expenses carry a
 * `bucket` (EXPENSE or SPECIAL_EXPENSE) and the draft `source` (CAREM until first saved in Lifecare, LIFECARE after).
 */
export type { NormberakningDraft, NormExpenseRow, NormIncomeRow, NormPersonRow };

type NormRow = NormPersonRow | NormIncomeRow | NormExpenseRow;

/** A selectable income/cost type — the code stored on the row plus its Swedish display label. */
export type TypeOption = NormTypeOption;

/**
 * The income/cost types a new row on the errand's normberäkning can have: careM's catalogues until the
 * beräkning is saved in Lifecare, Lifecare's own after that.
 */
export const getNormberakningTypes = (errandId: string): Promise<ServiceResponse<NormberakningTypes>> =>
  unwrapData(apiService.get<NormberakningTypesApiResponse>(apiPath`errands/${errandId}/normberakning/types`));

const byPosition = (first: { position?: number }, second: { position?: number }): number =>
  (first.position ?? 0) - (second.position ?? 0);

/**
 * Orders each editable section by the server-assigned, stable `position` so rows keep their place across
 * refreshes (caremanagement already returns them sorted; we sort defensively to make the order explicit).
 */
const sortDraftRows = (draft: NormberakningDraft): NormberakningDraft => ({
  ...draft,
  persons: draft.persons ? [...draft.persons].sort(byPosition) : draft.persons,
  incomes: draft.incomes ? [...draft.incomes].sort(byPosition) : draft.incomes,
  expenses: draft.expenses ? [...draft.expenses].sort(byPosition) : draft.expenses,
  specialExpenses: draft.specialExpenses ? [...draft.specialExpenses].sort(byPosition) : draft.specialExpenses,
});

/** Fetches the Lifecare-aligned draft normberäkning for an errand. */
export const getNormberakningDraft = (errandId: string): Promise<ServiceResponse<NormberakningDraft>> =>
  mapData(
    apiService.get<NormberakningDraftApiResponse>(apiPath`errands/${errandId}/normberakning/draft`),
    sortDraftRows
  );

/** Adds a handläggare row to a section. */
export const addNormRow = (
  errandId: string,
  section: NormSection,
  input: NormRowInputDto
): Promise<ServiceResponse<NormRow>> =>
  unwrapData(apiService.post<ApiResponse<NormRow>>(apiPath`errands/${errandId}/normberakning/draft/${section}`, input));

/** Sets the handläggare value(s)/note on a row. */
export const updateNormRow = (
  errandId: string,
  section: NormSection,
  rowId: string,
  input: NormRowInputDto
): Promise<ServiceResponse<NormRow>> =>
  unwrapData(
    apiService.patch<ApiResponse<NormRow>>(apiPath`errands/${errandId}/normberakning/draft/${section}/${rowId}`, input)
  );

/** Soft-deletes a row. */
export const deleteNormRow = (
  errandId: string,
  section: NormSection,
  rowId: string
): Promise<ServiceResponse<NormRow>> =>
  unwrapData(
    apiService.delete<ApiResponse<NormRow>>(apiPath`errands/${errandId}/normberakning/draft/${section}/${rowId}`)
  );

/** Restores a soft-deleted row. */
export const restoreNormRow = (
  errandId: string,
  section: NormSection,
  rowId: string
): Promise<ServiceResponse<NormRow>> =>
  unwrapData(
    apiService.post<ApiResponse<NormRow>>(
      apiPath`errands/${errandId}/normberakning/draft/${section}/${rowId}/restore`,
      {}
    )
  );

/** Updates the header — the household size from Gemensamma kostnader; in Lifecare once the beräkning is there. */
export const updateNormHeader = (
  errandId: string,
  input: NormHeaderInputDto
): Promise<ServiceResponse<NormberakningDraft>> =>
  unwrapData(
    apiService.patch<NormberakningDraftApiResponse>(apiPath`errands/${errandId}/normberakning/draft/header`, input)
  );

/**
 * The beräkning preceding the errand's own period, read from Lifecare. Read-only — the values Lifecare
 * settled on. Resolves to `null` when the applicant has no earlier beräkning, which is a normal state
 * rather than an error.
 */
export const getPreviousNormberakning = (errandId: string): Promise<ServiceResponse<PreviousCalculationView | null>> =>
  mapData(
    apiService.get<PreviousCalculationApiResponse>(apiPath`errands/${errandId}/normberakning/previous`),
    (previous) => previous ?? null
  );
