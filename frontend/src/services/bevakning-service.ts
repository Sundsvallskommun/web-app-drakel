import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** A bevakning (date-bound watch/reminder) on an errand. Defined locally mirroring the backend response. */
export interface Bevakning {
  id?: string;
  /** Provenance: CASEWORKER (authored in Draken) or LIFECARE (read out of Lifecare by RPA). */
  source?: 'CASEWORKER' | 'LIFECARE';
  /** The monitoring's id in Lifecare; null until a caseworker row has been mirrored. */
  lifecareId?: string;
  title?: string;
  description?: string;
  /** Bevakningsdatum — when the watch becomes relevant (yyyy-MM-dd). */
  startDate?: string;
  /** When the watch ends — open-ended when omitted (yyyy-MM-dd). */
  endDate?: string;
  createdBy?: string;
  created?: string;
  updated?: string;
}

/** The fields sent when creating or replacing a bevakning. */
export interface BevakningInput {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
}

/** Fetches the bevakningar on an errand. */
export const getBevakningar = (errandId: string): Promise<ServiceResponse<Bevakning[]>> =>
  apiService
    .get<ApiResponse<Bevakning[]>>(`errands/${errandId}/bevakningar`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Creates a bevakning on an errand. */
export const createBevakning = (errandId: string, input: BevakningInput): Promise<ServiceResponse<Bevakning>> =>
  apiService
    .post<ApiResponse<Bevakning>>(`errands/${errandId}/bevakningar`, input)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Deletes a bevakning. */
export const deleteBevakning = (errandId: string, bevakningId: string): Promise<ServiceResponse<null>> =>
  apiService
    .delete<ApiResponse<null>>(`errands/${errandId}/bevakningar/${bevakningId}`)
    .then(() => ({ data: null }))
    .catch(toServiceError);
