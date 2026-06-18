'use client';

import { acknowledgeWarning, Warning } from '@services/warning-service';
import { Button, Spinner } from '@sk-web-gui/react';
import { AlertTriangle } from 'lucide-react';
import { FC, useState } from 'react';

// Human-readable labels for the caremanagement warning types.
const WARNING_TYPE_LABELS: Record<string, string> = {
  UNHANDLED_INCOME: 'Ej hanterad inkomst',
  INCOME_CHANGE: 'Inkomständring',
  MISSING_SSBTEK: 'Saknas i SSBTEK',
  NEW_INCOME: 'Ny inkomst',
  NEW_EXPENSE: 'Ny utgift',
  NEW_PERSON: 'Ny person',
  INCOME_DROPPED: 'Bortfallen inkomst',
  HOUSEHOLD_CHANGE: 'Ändrad hushållssammansättning',
};

interface ErrandWarningsProps {
  errandId: string;
  /** The OPEN warnings to show (acknowledged/closed ones are filtered out by the caller). */
  warnings: Warning[];
  isLoading: boolean;
  loadError: boolean;
  refresh: () => void;
}

export const ErrandWarnings: FC<ErrandWarningsProps> = ({ errandId, warnings, isLoading, loadError, refresh }) => {
  const [acknowledgingId, setAcknowledgingId] = useState<string>();
  const [actionError, setActionError] = useState<string>();

  const acknowledge = async (warningId?: string) => {
    if (!warningId) {
      return;
    }
    setAcknowledgingId(warningId);
    setActionError(undefined);
    const result = await acknowledgeWarning(errandId, warningId);
    setAcknowledgingId(undefined);
    if (result.error) {
      setActionError('Det gick inte att kvittera varningen');
      return;
    }
    refresh();
  };

  return (
    <div className="flex flex-col gap-16">
      <h2 className="text-h4-sm md:text-h4-md m-0">Varningar</h2>

      {actionError && <p className="text-error-surface-primary m-0">{actionError}</p>}

      {isLoading ?
        <Spinner size={3} />
      : loadError ?
        <p className="m-0">Det gick inte att hämta varningar</p>
      : warnings.length === 0 ?
        <p className="m-0 text-dark-secondary">Inga varningar</p>
      : <ul className="flex flex-col gap-12 m-0 p-0 list-none">
          {warnings.map((warning, index) => (
            <li
              key={warning.id ?? index}
              className="flex flex-col gap-12 rounded-12 border-1 border-warning-surface-primary bg-warning-background-100 p-16"
            >
              <div className="flex items-start gap-12">
                <AlertTriangle size={20} className="shrink-0 mt-2 text-warning-surface-primary" />
                <div className="flex flex-col gap-2">
                  {warning.type ?
                    <span className="font-bold text-small">{WARNING_TYPE_LABELS[warning.type] ?? warning.type}</span>
                  : null}
                  <span className="text-small break-words">{warning.message}</span>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                color="vattjom"
                loading={acknowledgingId === warning.id}
                loadingText="Kvitterar…"
                onClick={() => void acknowledge(warning.id)}
              >
                Kvittera
              </Button>
            </li>
          ))}
        </ul>
      }
    </div>
  );
};
