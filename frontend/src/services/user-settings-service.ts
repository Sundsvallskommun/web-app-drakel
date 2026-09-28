import { UserSettingsApiResponse, UserSettingsView } from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';

/** The signed-in handläggare's own settings — careM's defaults until they save any. */
export const getUserSettings = (): Promise<ServiceResponse<UserSettingsView>> =>
  unwrapData(apiService.get<UserSettingsApiResponse>('me/settings'));

/** Saves the signed-in handläggare's settings, replacing what they had saved. */
export const saveUserSettings = (settings: UserSettingsView): Promise<ServiceResponse<UserSettingsView>> =>
  unwrapData(apiService.put<UserSettingsApiResponse>('me/settings', settings));
