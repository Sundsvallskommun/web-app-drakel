import { Actualisation, ActualisationsApiResponse } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, discardData, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/** Lists the applicant's Lifecare aktualiseringar (case intakes) for the errand. */
export const getActualisations = (errandId: string): Promise<ServiceResponse<Actualisation[]>> =>
  unwrapData(apiService.get<ActualisationsApiResponse>(apiPath`errands/${errandId}/actualisations`));

/** Archives the errand's application PDF onto a chosen aktualisering (stamps it onto the errand). */
export const archiveToActualisation = (errandId: string, actualisationId: number): Promise<ServiceResponse<null>> =>
  discardData(apiService.post(apiPath`errands/${errandId}/actualisations/${actualisationId}/archive`, {}));
