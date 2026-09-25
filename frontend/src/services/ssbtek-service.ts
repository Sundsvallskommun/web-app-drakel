import {
  SsbtekChangesApiResponse,
  SsbtekChangesView,
  SsbtekPaymentsApiResponse,
  SsbtekPaymentsView,
  SsbtekTransferIncomeDto,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';
import { SsbtekPeriod } from '@utils/ssbtek-period';

const ssbtekPath = (errandId: string, ...parts: string[]): string =>
  ['errands', encodeURIComponent(errandId), 'ssbtek', ...parts].join('/');

/**
 * The payments SSBTEK reports to the errand's sökande, any medsökande and children, read live through careM (which
 * logs the read on the errand). The errand is given as its route segment — errand number or id. Without a period
 * careM reads month M−2 through the current month.
 */
export const getSsbtekPayments = (
  errandId: string,
  period?: SsbtekPeriod
): Promise<ServiceResponse<SsbtekPaymentsView>> =>
  apiService
    .get<SsbtekPaymentsApiResponse>(ssbtekPath(errandId, 'payments'), { params: period })
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Where SSBTEK and the normberäkning in Lifecare disagree, per income type and person — what can be transferred. */
export const getSsbtekChanges = (errandId: string): Promise<ServiceResponse<SsbtekChangesView>> =>
  apiService
    .get<SsbtekChangesApiResponse>(ssbtekPath(errandId, 'changes'))
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/**
 * Transfers the picked incomes into the normberäkning at SSBTEK's amounts; careM then keeps them from being
 * transferred again. Answers with the comparison as it stands after.
 */
export const transferSsbtekIncomes = (
  errandId: string,
  incomes: SsbtekTransferIncomeDto[]
): Promise<ServiceResponse<SsbtekChangesView>> =>
  apiService
    .post<SsbtekChangesApiResponse>(ssbtekPath(errandId, 'changes', 'transfer'), { incomes })
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
