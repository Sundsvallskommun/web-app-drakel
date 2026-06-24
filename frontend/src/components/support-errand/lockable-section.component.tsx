'use client';

import { Lock } from 'lucide-react';
import { FC, ReactNode } from 'react';

/** The "section approved and locked" banner shown above a locked section. */
export const LockedBanner: FC = () => (
  <div className="flex items-center gap-8 rounded-12 border-1 border-divider bg-background-200 px-16 py-12 text-small">
    <Lock size={16} className="shrink-0" />
    <span>Sektionen är godkänd och låst för redigering. Avmarkera godkännandet för att redigera igen.</span>
  </div>
);

/**
 * Disables every input/select/button inside while keeping the content fully visible and scrollable, so an
 * approved section stays readable. NOTE: a disabled `<fieldset>` also disables any tab buttons nested
 * inside it — wrap only the editable content, never a tab navigation row, or the tabs become unclickable.
 * For a tabbed section, render {@link LockedBanner} once and apply this per tab panel (not around the Tabs).
 */
export const LockFieldset: FC<{ locked: boolean; children: ReactNode }> = ({ locked, children }) => (
  <fieldset disabled={locked} className="border-0 p-0 m-0 min-w-0">
    {children}
  </fieldset>
);
