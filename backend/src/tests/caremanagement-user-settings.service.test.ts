import CaremanagementApiService from '@services/caremanagement-api.service';
import CaremanagementUserSettingsService from '@services/caremanagement-user-settings.service';
import { caremanagementMunicipalityUrl } from '@utils/caremanagement-url';
import { afterEach, describe, expect, it, vi } from 'vitest';

// careM keeps settings per municipality, in no namespace.
const SETTINGS_URL = caremanagementMunicipalityUrl('user-settings', 'joe01doe');

describe('CaremanagementUserSettingsService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads the handläggare's settings from careM", async () => {
    const get = vi.spyOn(CaremanagementApiService.prototype, 'get').mockResolvedValue({
      data: { adAccount: 'joe01doe', ssbtekOpenInNewWindow: false, created: '2026-09-24T10:00:00Z' },
      message: 'success',
    });

    expect(await new CaremanagementUserSettingsService().read('joe01doe')).toEqual({ ssbtekOpenInNewWindow: false });
    expect(get).toHaveBeenCalledWith({ url: SETTINGS_URL });
  });

  it('replaces the saved settings with the ones given', async () => {
    const put = vi.spyOn(CaremanagementApiService.prototype, 'put').mockResolvedValue({ data: undefined, message: 'success' });

    expect(await new CaremanagementUserSettingsService().replace('joe01doe', { ssbtekOpenInNewWindow: true })).toEqual({
      ssbtekOpenInNewWindow: true,
    });
    expect(put).toHaveBeenCalledWith({
      url: SETTINGS_URL,
      data: { ssbtekOpenInNewWindow: true },
    });
  });
});
