'use client';

import { Warning, warningTypeLabel } from '@services/warning-service';
import { AlertTriangle } from 'lucide-react';
import { FC } from 'react';

/**
 * Compact, display-only list of the OPEN warnings relevant to a normberäkning sub-tab (e.g. income
 * warnings on the Inkomster tab). Acknowledging is done from the sidebar "Varningar" panel.
 */
export const NormberakningWarnings: FC<{ warnings: Warning[] }> = ({ warnings }) => {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-8 m-0 p-0 list-none">
      {warnings.map((warning, index) => (
        <li
          key={warning.id ?? index}
          className="flex items-start gap-12 rounded-12 border-1 border-warning-surface-primary bg-warning-background-100 p-12"
        >
          <AlertTriangle size={18} className="shrink-0 mt-2 text-warning-surface-primary" />
          <div className="flex flex-col gap-2">
            {warning.type ? <span className="font-bold text-small">{warningTypeLabel(warning.type)}</span> : null}
            <span className="text-small break-words">{warning.message}</span>
          </div>
        </li>
      ))}
    </ul>
  );
};
