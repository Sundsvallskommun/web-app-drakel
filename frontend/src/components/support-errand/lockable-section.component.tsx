'use client';

import { cx } from '@sk-web-gui/react';
import { Lock } from 'lucide-react';
import { FC, ReactNode } from 'react';

/**
 * Wraps a section's editable content and locks it when the section is approved. A disabled `<fieldset>`
 * natively disables every input/select/button inside, so no per-control wiring is needed. The
 * approval checkbox is kept outside this wrapper so the handläggare can withdraw approval to unlock.
 */
export const LockableSection: FC<{ locked: boolean; children: ReactNode }> = ({ locked, children }) => (
  <>
    {locked ?
      <div className="flex items-center gap-8 rounded-12 border-1 border-divider bg-background-200 px-16 py-12 text-small">
        <Lock size={16} className="shrink-0" />
        <span>Sektionen är godkänd och låst för redigering. Avmarkera godkännandet för att redigera igen.</span>
      </div>
    : null}
    <fieldset disabled={locked} className={cx('border-0 p-0 m-0 min-w-0', locked && 'opacity-60 pointer-events-none')}>
      {children}
    </fieldset>
  </>
);
