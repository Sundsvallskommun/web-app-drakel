'use client';

import { acknowledgeWarning, Warning, warningTypeLabel } from '@services/warning-service';
import { Alert } from '@sk-web-gui/alert';
import { FC, useState } from 'react';

interface NormberakningWarningsProps {
  errandId: string;
  /** The OPEN warnings relevant to this sub-tab. */
  warnings: Warning[];
  /** Refreshes the warnings after one is acknowledged (so it disappears here and in the sidebar). */
  onAcknowledged: () => void;
}

/**
 * The OPEN warnings relevant to a normberäkning sub-tab (e.g. income warnings on the Inkomster tab), each
 * rendered as a warning Alert with a "Kvittera" action — the same acknowledge flow as the sidebar
 * "Varningar" panel.
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
          <li key={warning.id ?? index}>
            <Alert type="warning">
              <Alert.Icon />
              <Alert.Content>
                {warning.type ?
                  <Alert.Content.Title className="font-bold">{warningTypeLabel(warning.type)}</Alert.Content.Title>
                : null}
                <Alert.Content.Description>{warning.message}</Alert.Content.Description>
              </Alert.Content>
              <Alert.Button
                size="sm"
                variant="secondary"
                color="vattjom"
                loading={acknowledgingId === warning.id}
                loadingText="Kvitterar…"
                onClick={() => void acknowledge(warning.id)}
              >
                Kvittera
              </Alert.Button>
            </Alert>
          </li>
        ))}
      </ul>
    </div>
  );
};
