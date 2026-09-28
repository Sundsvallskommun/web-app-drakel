import { LifecareSectionStatusApiResponse, LifecareSectionStatusView } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/** Whether the errand's beräkning is slutlig, its beslut saved and its utbetalning registered in Lifecare. */
export const getLifecareSectionStatus = (errandId: string): Promise<ServiceResponse<LifecareSectionStatusView>> =>
  unwrapData(apiService.get<LifecareSectionStatusApiResponse>(apiPath`errands/${errandId}/lifecare-section-status`));
