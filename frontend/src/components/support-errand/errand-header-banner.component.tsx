'use client';

import { cx } from '@sk-web-gui/react';
import { AlertTriangle } from 'lucide-react';
import { FC, ReactNode } from 'react';

/**
 * A full-width banner directly under the errand's action bar, for a state the handläggare should see
 * before reading anything else on the errand (an SSBTEK read failure, a secrecy marking). It spans the
 * whole page rather than sitting inside a tab, because it concerns the errand and not one view of it.
 */
export const ErrandHeaderBanner: FC<{
  children: ReactNode;
  /** Rendered at the right end — a link or button when the banner has something to act on. */
  action?: ReactNode;
  className?: string;
}> = ({ children, action, className }) => (
  <div
    role="status"
    className={cx(
      'w-full flex items-center justify-between gap-16 flex-wrap',
      'bg-warning-background-100 border-b-1 border-warning-background-200 px-24 md:px-64 py-12',
      className
    )}
  >
    <div className="flex items-start gap-12 min-w-0">
      <AlertTriangle size={20} className="shrink-0 mt-2 text-warning-surface-primary" />
      <span className="break-words">{children}</span>
    </div>
    {action}
  </div>
);
