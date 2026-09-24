import { LifecareSectionStatusApiResponse, LifecareSectionStatusView } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/** Whether the errand's beräkning is slutlig, its beslut saved and its utbetalning registered in Lifecare. */
export const getLifecareSectionStatus = (errandId: string): Promise<ServiceResponse<LifecareSectionStatusView>> =>
  apiService
    .get<LifecareSectionStatusApiResponse>(`errands/${errandId}/lifecare-section-status`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
