'use client';

import { UserSettingsView } from '@data-contracts/backend/data-contracts';
import { useServiceQuery } from '@hooks/use-service-query';
import { getUserSettings, saveUserSettings } from '@services/user-settings-service';
import { createContext, FC, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

interface SsbtekPreferenceContextValue {
  /** Whether "Hämta från SSBTEK" opens the SSBTEK page in a new tab — otherwise the panel on the errand. */
  openInNewTab: boolean;
  /** Saves the choice in the handläggare's settings in careM. */
  setOpenInNewTab: (openInNewTab: boolean) => void;
}

// careM's own default, used until the settings are read — and if they cannot be.
const DEFAULT_SETTINGS: UserSettingsView = { ssbtekOpenInNewWindow: true };

const SsbtekPreferenceContext = createContext<SsbtekPreferenceContextValue | undefined>(undefined);

/**
 * Where the handläggare wants SSBTEK opened, from their settings in careM — shared by the header button, which
 * follows it, and the user menu, which changes it. A change shows at once and is undone if it cannot be saved.
 */
export const SsbtekPreferenceProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { data: settings } = useServiceQuery<UserSettingsView>(getUserSettings, { initialData: DEFAULT_SETTINGS });
  const [chosen, setChosen] = useState<boolean>();
  const openInNewTab = chosen ?? settings.ssbtekOpenInNewWindow;

  const setOpenInNewTab = useCallback(
    (next: boolean) => {
      const previous = openInNewTab;
      setChosen(next);
      void saveUserSettings({ ssbtekOpenInNewWindow: next }).then((result) => {
        if (result.error) {
          setChosen(previous);
        }
      });
    },
    [openInNewTab]
  );

  const value = useMemo(() => ({ openInNewTab, setOpenInNewTab }), [openInNewTab, setOpenInNewTab]);
  return <SsbtekPreferenceContext.Provider value={value}>{children}</SsbtekPreferenceContext.Provider>;
};

/** Where the handläggare wants SSBTEK opened. Throws outside the provider, which would be a wiring bug. */
export const useSsbtekPreference = (): SsbtekPreferenceContextValue => {
  const context = useContext(SsbtekPreferenceContext);
  if (!context) {
    throw new Error('useSsbtekPreference must be used inside an SsbtekPreferenceProvider');
  }
  return context;
};
