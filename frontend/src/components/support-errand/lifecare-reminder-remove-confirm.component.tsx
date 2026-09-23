'use client';

import { Button } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LifecareReminderRemoveConfirmProps {
  /** Removes the bevakning; resolves to Lifecare's reason when it refused, otherwise undefined. */
  onConfirm: () => Promise<string | undefined>;
  onCancel: () => void;
}

/**
 * Asks before a bevakning is removed — a removal in Lifecare cannot be undone. Stays open with Lifecare's
 * reason when the removal is refused.
 */
export const LifecareReminderRemoveConfirm: FC<LifecareReminderRemoveConfirmProps> = ({ onConfirm, onCancel }) => {
  const { t } = useTranslation('sidebar');
  const [removing, setRemoving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const confirm = async (): Promise<void> => {
    setRemoving(true);
    setError(undefined);
    const refusal = await onConfirm();
    setRemoving(false);
    setError(refusal);
  };

  return (
    <div className="flex flex-col gap-8 mt-12">
      <span>{t('bevakningar.removeConfirm')}</span>
      {error ?
        <span role="alert" className="text-error-surface-primary">
          {error}
        </span>
      : null}
      <div className="flex gap-8">
        <Button size="sm" color="error" loading={removing} onClick={() => void confirm()}>
          {t('bevakningar.remove')}
        </Button>
        <Button size="sm" variant="secondary" disabled={removing} onClick={onCancel}>
          {t('common:cancel')}
        </Button>
      </div>
    </div>
  );
};
