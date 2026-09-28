'use client';

import 'dayjs/locale/sv';

import { useUserStore } from '@services/user-service/user-service';
import { ColorSchemeMode, GuiProvider } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ReactNode, useEffect } from 'react';

dayjs.extend(utc);
// Month names are not overridden here: application months are written by formatApplicationMonth, the one
// formatter for them, and short dates keep dayjs's own Swedish ("12 aug").
dayjs.locale('sv');

interface ClientApplicationProps {
  children: ReactNode;
}

const AppLayout = ({ children }: ClientApplicationProps) => {
  const getMe = useUserStore((state) => state.getMe);

  useEffect(() => {
    void getMe();
  }, [getMe]);

  // Force light mode for now (ignores the stored/system preference).
  return <GuiProvider colorScheme={ColorSchemeMode.Light}>{children}</GuiProvider>;
};

export default AppLayout;
