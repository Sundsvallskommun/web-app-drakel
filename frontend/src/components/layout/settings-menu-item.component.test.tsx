import { SsbtekPreferenceProvider } from '@components/ssbtek/ssbtek-preference-context';
import { getUserSettings, saveUserSettings } from '@services/user-settings-service';
import { PopupMenu } from '@sk-web-gui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SettingsMenuItem } from './settings-menu-item.component';

vi.mock('@services/user-settings-service', () => ({ getUserSettings: vi.fn(), saveUserSettings: vi.fn() }));

/** Opens the menu and its Inställningar submenu, as the handläggare does in the user menu. */
const openSettings = async (): Promise<void> => {
  render(
    <SsbtekPreferenceProvider>
      <PopupMenu>
        <PopupMenu.Button>Meny</PopupMenu.Button>
        <PopupMenu.Panel>
          <PopupMenu.Items>
            <SettingsMenuItem />
          </PopupMenu.Items>
        </PopupMenu.Panel>
      </PopupMenu>
    </SsbtekPreferenceProvider>
  );
  await openMenu();
};

/** Opens the menu and the submenu — again after a click on a setting has closed them. */
const openMenu = async (): Promise<void> => {
  fireEvent.click(screen.getByRole('button', { name: 'Meny' }));
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Inställningar' }));
};

const ssbtekSetting = () => screen.findByRole('menuitem', { name: 'Öppna SSBTEK i ny flik' });

describe('SettingsMenuItem', () => {
  beforeEach(() => {
    vi.mocked(getUserSettings).mockResolvedValue({ data: { ssbtekOpenInNewWindow: true } });
    vi.mocked(saveUserSettings).mockReset();
  });

  it('shows under Inställningar whether SSBTEK opens in a new tab, and saves the other choice when clicked', async () => {
    vi.mocked(saveUserSettings).mockResolvedValue({ data: { ssbtekOpenInNewWindow: false } });
    await openSettings();

    const setting = await ssbtekSetting();
    expect(setting).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(setting);

    expect(saveUserSettings).toHaveBeenCalledWith({ ssbtekOpenInNewWindow: false });
    await openMenu();
    expect(await ssbtekSetting()).toHaveAttribute('aria-checked', 'false');
  });

  it('keeps the saved choice when the new one cannot be saved', async () => {
    vi.mocked(saveUserSettings).mockResolvedValue({ error: 502 });
    await openSettings();

    fireEvent.click(await ssbtekSetting());
    await openMenu();

    await waitFor(async () => {
      expect(await ssbtekSetting()).toHaveAttribute('aria-checked', 'true');
    });
    expect(saveUserSettings).toHaveBeenCalledWith({ ssbtekOpenInNewWindow: false });
  });

  it("shows the handläggare's saved choice", async () => {
    vi.mocked(getUserSettings).mockResolvedValue({ data: { ssbtekOpenInNewWindow: false } });

    await openSettings();

    await waitFor(async () => {
      expect(await ssbtekSetting()).toHaveAttribute('aria-checked', 'false');
    });
  });
});
