import {
  SsbtekChangesApiResponse,
  SsbtekChangesView,
  SsbtekPaymentsApiResponse,
  SsbtekPaymentsView,
  SsbtekTransferIncomeDto,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';
import { SsbtekPeriod } from '@utils/ssbtek-period';

/**
 * The payments SSBTEK reports to the errand's sökande, any medsökande and children, read live through careM (which
 * logs the read on the errand). The errand is given as its route segment — errand number or id. Without a period
 * careM reads month M−2 through the current month.
 */
export const getSsbtekPayments = (
  errandId: string,
  period?: SsbtekPeriod
): Promise<ServiceResponse<SsbtekPaymentsView>> =>
  unwrapData(
    apiService.get<SsbtekPaymentsApiResponse>(apiPath`errands/${errandId}/ssbtek/payments`, { params: period })
  );

/** Where SSBTEK and the normberäkning in Lifecare disagree, per income type and person — what can be transferred. */
export const getSsbtekChanges = (errandId: string): Promise<ServiceResponse<SsbtekChangesView>> =>
  unwrapData(apiService.get<SsbtekChangesApiResponse>(apiPath`errands/${errandId}/ssbtek/changes`));

/**
 * Transfers the picked incomes into the normberäkning at SSBTEK's amounts; careM then keeps them from being
 * transferred again. Answers with the comparison as it stands after.
 */
export const transferSsbtekIncomes = (
  errandId: string,
  incomes: SsbtekTransferIncomeDto[]
): Promise<ServiceResponse<SsbtekChangesView>> =>
  unwrapData(
    apiService.post<SsbtekChangesApiResponse>(apiPath`errands/${errandId}/ssbtek/changes/transfer`, { incomes })
  );
