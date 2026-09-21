import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/**
 * An EB income warning on an errand (caremanagement Warning). Defined locally — like {@link Note} —
 * mirroring the backend Warning response. `status` is OPEN until a handläggare acknowledges or closes it.
 */
export interface Warning {
  id?: string;
  /** The machine code; show `typeDisplayName` instead — caremanagement owns the labels for all 33 types. */
  type?: string;
  typeDisplayName?: string;
  /** The tab the warning belongs to, derived from the type by caremanagement. */
  section?: 'CALCULATION' | 'DECISION' | 'PAYMENT';
  sourceKey?: string;
  message?: string;
  status?: 'OPEN' | 'ACKNOWLEDGED' | 'CLOSED';
  statusDisplayName?: string;
  autoResolved?: boolean;
  created?: string;
  updated?: string;
}

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
