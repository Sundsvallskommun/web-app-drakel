'use client';

import { ReactNode, useState } from 'react';

import { AppHeader } from './app-header.component';
import { ErrandHeaderContext, HeaderErrand } from './errand-header-context';

/**
 * Full-height app shell for the errand/register pages: a slim header over a scrollable content area
 * on the draken `bg-background-100` page background (cards/sidebars sit on it as bg-background-content).
 * Provides the errand-header context so the page can surface errand status/title into the header.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  const [errand, setErrand] = useState<HeaderErrand | undefined>(undefined);

  return (
    <ErrandHeaderContext.Provider value={{ errand, setErrand }}>
      <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-background-100">
        <AppHeader />
        {/* min-h-0 lets the content area shrink so children (the errand view) can own full height + scroll */}
        <div className="grow min-h-0">{children}</div>
      </div>
    </ErrandHeaderContext.Provider>
  );
}
