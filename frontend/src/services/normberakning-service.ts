import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * One income row of the draft normberäkning. Defined locally — like {@link Note} — mirroring the
 * backend response. Rows from caremanagement carry an FC `typeId`/`typeName`; handläggare-added rows
 * have no `typeId`.
 */
export interface DraftIncomeRow {
  typeId?: number;
  typeName?: string;
  applicantAmount?: number;
  applicantAmountDate?: string;
  coApplicantAmount?: number;
  coApplicantAmountDate?: string;
  note?: string;
}

/** The editable draft normberäkning — income rows only (expenses/family/result are not exposed by the API). */
export interface NormberakningDraft {
  errandId?: string;
  applicationMonth?: string;
  edited?: boolean;
  rows?: DraftIncomeRow[];
  created?: string;
  updated?: string;
}

/** Fetches the draft normberäkning (income rows) for an errand. */
export const getNormberakningDraft = (errandId: string): Promise<ServiceResponse<NormberakningDraft>> =>
  apiService
    .get<ApiResponse<NormberakningDraft>>(`errands/${errandId}/normberakning/draft`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Saves the edited income rows of the draft normberäkning. */
export const updateNormberakningDraft = (
  errandId: string,
  rows: DraftIncomeRow[]
): Promise<ServiceResponse<NormberakningDraft>> =>
  apiService
    .put<ApiResponse<NormberakningDraft>>(`errands/${errandId}/normberakning/draft`, { rows })
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
