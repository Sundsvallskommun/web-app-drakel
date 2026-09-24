'use client';

import { SsbtekPanel } from '@components/ssbtek/ssbtek-panel.component';
import { SsbtekPanelProvider } from '@components/ssbtek/ssbtek-panel-context';
import { ReactNode } from 'react';

import { AppHeader } from './app-header.component';

/**
 * Full-height app shell for the errand/register pages: the dark header over a scrollable content area
 * on the draken `bg-background-100` page background (cards/sidebars sit on it as bg-background-content).
 * The SSBTEK panel, opened from the header, lies over the foot of the content area.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <SsbtekPanelProvider>
      <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background-100">
        <AppHeader />
        {/* min-h-0 lets the content area shrink so children (the errand view) can own full height + scroll */}
        <div className="grow min-h-0">{children}</div>
        <SsbtekPanel />
      </div>
    </SsbtekPanelProvider>
  );
}
