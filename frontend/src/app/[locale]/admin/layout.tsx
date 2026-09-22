import AppShell from '@components/layout/app-shell.component';
import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
