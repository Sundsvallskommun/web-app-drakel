import { SsbtekPaymentsApiResponse, SsbtekPaymentsView } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/**
 * The payments SSBTEK reports to the errand's sökande and any medsökande, read live through careM (which logs the
 * read on the errand). The errand is given as its route segment — errand number or id. careM picks the period:
 * month M−2 through the current month.
 */
export const getSsbtekPayments = (errandId: string): Promise<ServiceResponse<SsbtekPaymentsView>> =>
  apiService
    .get<SsbtekPaymentsApiResponse>(`errands/${encodeURIComponent(errandId)}/ssbtek/payments`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
