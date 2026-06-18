import 'dotenv';

import { LocalStorage } from '@interfaces/localstorage';
import { ColorSchemeMode } from '@sk-web-gui/react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export const useLocalStorage = create(
  persist<LocalStorage>(
    (set) => ({
      // Default to light mode for now (instead of following the system preference).
      colorScheme: ColorSchemeMode.Light,
      setColorScheme: (colorScheme) => set(() => ({ colorScheme })),
    }),
    {
      name: `${process.env.NEXT_PUBLIC_APP_NAME}-admin-store`,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
