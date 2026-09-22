import { AdminSection } from '@components/admin/admin-section.component';
import AppShell from '@components/layout/app-shell.component';
import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <AdminSection>{children}</AdminSection>
    </AppShell>
  );
}
