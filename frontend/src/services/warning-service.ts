import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * An EB income warning on an errand (caremanagement Warning). Defined locally — like {@link Note} —
 * mirroring the backend Warning response. `status` is OPEN until a handläggare acknowledges or closes it.
 */
export interface Warning {
  id?: string;
  /** UNHANDLED_INCOME / INCOME_CHANGE / MISSING_SSBTEK / NEW_INCOME. */
  type?: string;
  sourceKey?: string;
  message?: string;
  status?: 'OPEN' | 'ACKNOWLEDGED' | 'CLOSED';
  autoResolved?: boolean;
  created?: string;
  updated?: string;
}

/** Human-readable Swedish labels for the caremanagement warning types. */
const WARNING_TYPE_LABELS: Record<string, string> = {
  UNHANDLED_INCOME: 'Ej hanterad inkomst',
  INCOME_CHANGE: 'Inkomständring',
  MISSING_SSBTEK: 'Saknas i SSBTEK',
  NEW_INCOME: 'Ny inkomst',
  NEW_EXPENSE: 'Ny utgift',
  NEW_PERSON: 'Ny person',
  INCOME_DROPPED: 'Bortfallen inkomst',
  HOUSEHOLD_CHANGE: 'Ändrad hushållssammansättning',
  EXPENSE_REVIEW: 'Kräver skälighetsbedömning',
  EXPENSE_CAPPED: 'Utgift över tak',
};

/** The label for a warning type — falls back to the raw code, or a generic label when missing. */
export const warningTypeLabel = (type?: string): string => (type ? (WARNING_TYPE_LABELS[type] ?? type) : 'Varning');

/** Fetches the EB income warnings on an errand. */
export const getWarnings = (errandId: string): Promise<ServiceResponse<Warning[]>> =>
  apiService
    .get<ApiResponse<Warning[]>>(`errands/${errandId}/warnings`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Acknowledges a warning so it is no longer OPEN (and disappears from the current list). */
export const acknowledgeWarning = (errandId: string, warningId: string): Promise<ServiceResponse<null>> =>
  apiService
    .patch<ApiResponse<null>>(`errands/${errandId}/warnings/${warningId}`, { status: 'ACKNOWLEDGED' })
    .then(() => ({ data: null }))
    .catch(toServiceError);

/** Re-opens an acknowledged/closed warning (sets it back to OPEN). */
export const reopenWarning = (errandId: string, warningId: string): Promise<ServiceResponse<null>> =>
  apiService
    .patch<ApiResponse<null>>(`errands/${errandId}/warnings/${warningId}`, { status: 'OPEN' })
    .then(() => ({ data: null }))
    .catch(toServiceError);
