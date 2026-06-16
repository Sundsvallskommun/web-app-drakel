'use client';

import { ColorSchemeMode, PopupMenu, RadioButton } from '@sk-web-gui/react';
import { useLocalStorage } from '@utils/use-localstorage.hook';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

/**
 * Light/dark/system colour scheme selector. The chosen mode is persisted in localStorage and fed
 * to the GuiProvider in the app layout, so the whole app re-themes.
 */
export const ColorSchemeItems = () => {
  const colorScheme = useLocalStorage(useShallow((state) => state.colorScheme));
  const setColorScheme = useLocalStorage((state) => state.setColorScheme);

  return (
    <PopupMenu.Items>
      <PopupMenu.Item>
        <RadioButton
          value={ColorSchemeMode.Light}
          onClick={() => {
            setColorScheme(ColorSchemeMode.Light);
          }}
          checked={colorScheme === ColorSchemeMode.Light}
        >
          Ljust <Sun className={colorScheme === ColorSchemeMode.Light ? '' : 'opacity-50'} />
        </RadioButton>
      </PopupMenu.Item>
      <PopupMenu.Item>
        <RadioButton
          value={ColorSchemeMode.Dark}
          onClick={() => {
            setColorScheme(ColorSchemeMode.Dark);
          }}
          checked={colorScheme === ColorSchemeMode.Dark}
        >
          Mörkt <Moon className={colorScheme === ColorSchemeMode.Dark ? '' : 'opacity-50'} />
        </RadioButton>
      </PopupMenu.Item>
      <PopupMenu.Item>
        <RadioButton
          value={ColorSchemeMode.System}
          onClick={() => {
            setColorScheme(ColorSchemeMode.System);
          }}
          checked={colorScheme === ColorSchemeMode.System}
        >
          System <Monitor className={colorScheme === ColorSchemeMode.System ? '' : 'opacity-50'} />
        </RadioButton>
      </PopupMenu.Item>
    </PopupMenu.Items>
  );
};
