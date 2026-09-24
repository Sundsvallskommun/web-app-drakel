import { UserSettingsApiResponse, UserSettingsView } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, toServiceError } from '@services/api-service';

/** The signed-in handläggare's own settings — careM's defaults until they save any. */
export const getUserSettings = (): Promise<ServiceResponse<UserSettingsView>> =>
  apiService
    .get<UserSettingsApiResponse>('me/settings')
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Saves the signed-in handläggare's settings, replacing what they had saved. */
export const saveUserSettings = (settings: UserSettingsView): Promise<ServiceResponse<UserSettingsView>> =>
  apiService
    .put<UserSettingsApiResponse>('me/settings', settings)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
