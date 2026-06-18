'use client';

import 'dayjs/locale/sv';

import { useUserStore } from '@services/user-service/user-service';
import { ColorSchemeMode, GuiProvider } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';
import { ReactNode, useEffect } from 'react';

dayjs.extend(utc);
dayjs.locale('sv');
dayjs.extend(updateLocale);
dayjs.updateLocale('sv', {
  months: [
    'Januari',
    'Februari',
    'Mars',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'Augusti',
    'September',
    'Oktober',
    'November',
    'December',
  ],
  monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
});

interface ClientApplicationProps {
  children: ReactNode;
}

const AppLayout = ({ children }: ClientApplicationProps) => {
  const getMe = useUserStore((state) => state.getMe);

  useEffect(() => {
    void getMe();
  }, [getMe]);

  // Force light mode for now (ignores the stored/system preference).
  return (
    <GuiProvider colorScheme={ColorSchemeMode.Light}>
      {children}
      {/* <InactivityMonitor /> */}
    </GuiProvider>
  );
};

export default AppLayout;
