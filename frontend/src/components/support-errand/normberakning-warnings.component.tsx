'use client';

import { acknowledgeWarning, Warning, warningTypeLabel } from '@services/warning-service';
import { Button } from '@sk-web-gui/react';
import { AlertTriangle } from 'lucide-react';
import { FC, useState } from 'react';

interface NormberakningWarningsProps {
  errandId: string;
  /** The OPEN warnings relevant to this sub-tab. */
  warnings: Warning[];
  /** Refreshes the warnings after one is acknowledged (so it disappears here and in the sidebar). */
  onAcknowledged: () => void;
}

/**
 * The OPEN warnings relevant to a normberäkning sub-tab (e.g. income warnings on the Inkomster tab),
 * each with a "Kvittera" action — the same acknowledge flow as the sidebar "Varningar" panel.
 */
export const NormberakningWarnings: FC<NormberakningWarningsProps> = ({ errandId, warnings, onAcknowledged }) => {
  const [acknowledgingId, setAcknowledgingId] = useState<string>();
  const [error, setError] = useState<string>();

  if (warnings.length === 0) {
    return null;
  }

  const acknowledge = async (warningId?: string) => {
    if (!warningId) {
      return;
    }
    setAcknowledgingId(warningId);
    setError(undefined);
    const result = await acknowledgeWarning(errandId, warningId);
    setAcknowledgingId(undefined);
    if (result.error) {
      setError('Det gick inte att kvittera varningen');
      return;
    }
    onAcknowledged();
  };

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-error-surface-primary m-0 text-small">{error}</p>}

      <ul className="flex flex-col gap-8 m-0 p-0 list-none">
        {warnings.map((warning, index) => (
          <li
            key={warning.id ?? index}
            className="flex items-start justify-between gap-12 rounded-12 border-1 border-warning-surface-primary bg-warning-background-100 p-12"
          >
            <div className="flex items-start gap-12 min-w-0">
              <AlertTriangle size={18} className="shrink-0 mt-2 text-warning-surface-primary" />
              <div className="flex flex-col gap-2 min-w-0">
                {warning.type ? <span className="font-bold text-small">{warningTypeLabel(warning.type)}</span> : null}
                <span className="text-small break-words">{warning.message}</span>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              color="vattjom"
              className="shrink-0"
              loading={acknowledgingId === warning.id}
              loadingText="Kvitterar…"
              onClick={() => void acknowledge(warning.id)}
            >
              Kvittera
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
};
