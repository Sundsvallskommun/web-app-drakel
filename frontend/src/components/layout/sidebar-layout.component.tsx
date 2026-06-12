'use client';

import { ReactNode, useState } from 'react';

interface SidebarLayoutProps {
  /** Renders the fixed sidebar. Receives the collapse state so it can size itself. */
  renderSidebar: (open: boolean, setOpen: (open: boolean) => void) => ReactNode;
  children: ReactNode;
}

/**
 * Two-column overview shell with a fixed left sidebar (draken look). The content area is padded
 * to clear the sidebar and adjusts when it collapses.
 */
export default function SidebarLayout({ renderSidebar, children }: SidebarLayoutProps) {
  const [open, setOpen] = useState<boolean>(true);

  return (
    <div className="min-h-screen w-full">
      <div className="flex grow w-full">
        {renderSidebar(open, setOpen)}
        <div className={`w-full grow flex ${open ? 'pl-[32rem]' : 'pl-[5.6rem]'} transition-all`}>{children}</div>
      </div>
    </div>
  );
}
