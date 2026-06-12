import AppShell from '@components/layout/app-shell.component';
import React from 'react';

export default function ArendeLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
