import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** A Lifecare aktualisering (case intake) the applicant has. Defined locally mirroring the backend response. */
export interface Actualisation {
  id?: number;
  type?: string;
  name?: string;
  date?: string;
  reason?: string;
  regards?: string;
  fromWho?: string;
  caseworker?: string;
  organization?: string;
  status?: string;
  investigationId?: number;
  serviceId?: number;
  decisionId?: number;
}

/** Lists the applicant's Lifecare aktualiseringar for the errand. */
export const getActualisations = (errandId: string): Promise<ServiceResponse<Actualisation[]>> =>
  apiService
    .get<ApiResponse<Actualisation[]>>(`errands/${errandId}/actualisations`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Archives the errand's application PDF onto a chosen aktualisering (stamps it onto the errand). */
export const archiveToActualisation = (
  errandId: string,
  actualisationId: number
): Promise<ServiceResponse<null>> =>
  apiService
    .post<unknown>(`errands/${errandId}/actualisations/${actualisationId}/archive`, {})
    .then(() => ({ data: null }))
    .catch(toServiceError);
