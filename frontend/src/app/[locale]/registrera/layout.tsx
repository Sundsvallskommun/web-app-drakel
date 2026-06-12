import AppShell from '@components/layout/app-shell.component';
import React from 'react';

export default function RegistreraLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
