import {
  UpdateWarningStatusDto,
  UpdateWarningStatusDtoStatusEnum,
  Warning,
  WarningsApiResponse,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, discardData, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/**
 * An EB income warning on an errand (caremanagement Warning). `status` is OPEN until a handläggare acknowledges or
 * closes it; `section` is the tab it belongs to (CALCULATION, DECISION or PAYMENT). Show `typeDisplayName` rather
 * than the machine `type` — caremanagement owns the labels.
 */
export type { Warning };

const setWarningStatus = (
  errandId: string,
  warningId: string,
  status: UpdateWarningStatusDtoStatusEnum
): Promise<ServiceResponse<null>> => {
  const update: UpdateWarningStatusDto = { status };
  return discardData(apiService.patch(apiPath`errands/${errandId}/warnings/${warningId}`, update));
};

/** Fetches the EB income warnings on an errand. */
export const getWarnings = (errandId: string): Promise<ServiceResponse<Warning[]>> =>
  unwrapData(apiService.get<WarningsApiResponse>(apiPath`errands/${errandId}/warnings`));

/** Acknowledges a warning so it is no longer OPEN (and disappears from the current list). */
export const acknowledgeWarning = (errandId: string, warningId: string): Promise<ServiceResponse<null>> =>
  setWarningStatus(errandId, warningId, UpdateWarningStatusDtoStatusEnum.ACKNOWLEDGED);

/** Re-opens an acknowledged/closed warning (sets it back to OPEN). */
export const reopenWarning = (errandId: string, warningId: string): Promise<ServiceResponse<null>> =>
  setWarningStatus(errandId, warningId, UpdateWarningStatusDtoStatusEnum.OPEN);
