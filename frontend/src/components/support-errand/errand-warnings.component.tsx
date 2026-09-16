'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { acknowledgeWarning, reopenWarning, Warning } from '@services/warning-service';
import { Button, Checkbox, cx } from '@sk-web-gui/react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrandWarningsProps {
  errandId: string;
  /** All warnings on the errand (the panel filters to OPEN unless "Visa aktuella" is unchecked). */
  warnings: Warning[];
  isLoading: boolean;
  loadError: boolean;
  refresh: () => void;
}

export const ErrandWarnings: FC<ErrandWarningsProps> = ({ errandId, warnings, isLoading, loadError, refresh }) => {
  const { t } = useTranslation('sidebar');
  const [busyId, setBusyId] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  // "Visa aktuella" — when checked (default) only OPEN warnings show; unchecked shows all (incl. kvitterade).
  const [showCurrentOnly, setShowCurrentOnly] = useState<boolean>(true);

  const visibleWarnings = showCurrentOnly ? warnings.filter((warning) => warning.status === 'OPEN') : warnings;

  const runStatusChange = async (warningId: string | undefined, action: () => Promise<{ error?: unknown }>) => {
    if (!warningId) {
      return;
    }
    setBusyId(warningId);
    setActionError(undefined);
    const result = await action();
    setBusyId(undefined);
    if (result.error) {
      setActionError(t('warnings.updateError'));
      return;
    }
    refresh();
  };

  return (
    <div className="flex flex-col gap-16">
      <div className="flex items-center justify-end gap-12 flex-wrap">
        <Checkbox
          checked={showCurrentOnly}
          onChange={(event) => {
            setShowCurrentOnly(event.target.checked);
          }}
        >
          {t('warnings.showCurrent')}
        </Checkbox>
      </div>

      {actionError && <p className="text-error-surface-primary m-0">{actionError}</p>}

      <AsyncContent
        isLoading={isLoading}
        error={loadError}
        errorText={t('warnings.loadError')}
        isEmpty={visibleWarnings.length === 0}
        emptyText={showCurrentOnly ? t('warnings.emptyCurrent') : t('warnings.empty')}
      >
        <ul className="flex flex-col gap-12 m-0 p-0 list-none">
          {visibleWarnings.map((warning, index) => {
            const open = warning.status === 'OPEN';
            return (
              <li
                key={warning.id ?? index}
                className={cx(
                  'flex flex-col gap-12 rounded-12 border-1 p-16',
                  open ? 'border-warning-surface-primary bg-warning-background-100' : 'border-gray-300 bg-gray-100'
                )}
              >
                <div className="flex items-start gap-12">
                  <AlertTriangle
                    size={20}
                    className={cx('shrink-0 mt-2', open ? 'text-warning-surface-primary' : 'text-gray-400')}
                  />
                  <div className={cx('flex flex-col gap-2', !open && 'text-gray-600')}>
                    {warning.type ?
                      <span className="font-bold text-small">
                        {t(`warnings.types.${warning.type}`, { defaultValue: warning.type })}
                        {!open && warning.status ?
                          ` · ${t(`warnings.status.${warning.status}`, { defaultValue: warning.status })}`
                        : ''}
                      </span>
                    : null}
                    <span className="text-small break-words">{warning.message}</span>
                  </div>
                </div>

                {open ?
                  <Button
                    size="sm"
                    variant="secondary"
                    color="vattjom"
                    loading={busyId === warning.id}
                    loadingText={t('warnings.acknowledging')}
                    onClick={() =>
                      void runStatusChange(warning.id, () => acknowledgeWarning(errandId, warning.id ?? ''))
                    }
                  >
                    {t('warnings.acknowledge')}
                  </Button>
                : warning.autoResolved ?
                  null
                : <Button
                    size="sm"
                    variant="tertiary"
                    leftIcon={<RotateCcw />}
                    loading={busyId === warning.id}
                    loadingText={t('warnings.reopening')}
                    onClick={() => void runStatusChange(warning.id, () => reopenWarning(errandId, warning.id ?? ''))}
                  >
                    {t('warnings.reopen')}
                  </Button>
                }
              </li>
            );
          })}
        </ul>
      </AsyncContent>
    </div>
  );
};
