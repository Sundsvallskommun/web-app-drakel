import CaremanagementApiService from '@services/caremanagement-api.service';
import { caremanagementMunicipalityUrl } from '@utils/caremanagement-url';

import { UserSettings } from '@/data-contracts/caremanagement/data-contracts';
import { UpdateUserSettingsDto } from '@/dtos/user-settings.dto';
import { UserSettingsView } from '@/responses/user-settings.response';

/**
 * A handläggare's own settings, which careM keeps per AD account for the municipality (in no namespace). careM
 * answers the defaults for someone who has saved nothing, so a read never fails for want of settings.
 */
class CaremanagementUserSettingsService {
  private apiService = new CaremanagementApiService();

  async read(adAccount: string): Promise<UserSettingsView> {
    const response = await this.apiService.get<UserSettings>({ url: this.url(adAccount) });
    return { ssbtekOpenInNewWindow: response.data.ssbtekOpenInNewWindow };
  }

  /** Saves the settings, replacing what was saved before. */
  async replace(adAccount: string, settings: UpdateUserSettingsDto): Promise<UserSettingsView> {
    await this.apiService.put<undefined>({
      url: this.url(adAccount),
      data: { ssbtekOpenInNewWindow: settings.ssbtekOpenInNewWindow } satisfies UserSettings,
    });
    return { ssbtekOpenInNewWindow: settings.ssbtekOpenInNewWindow };
  }

  private url(adAccount: string): string {
    return caremanagementMunicipalityUrl('user-settings', encodeURIComponent(adAccount));
  }
}

export default CaremanagementUserSettingsService;
