'use client';

import { Button } from '@sk-web-gui/react';
import { Lock } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * "Spara och skrivskydda beslut": saves the beslut in Lifecare write-protected. The beslut can then no longer
 * be changed from Drakel, so it asks first.
 */
export const BeslutWriteProtectButton: FC<{ disabled?: boolean; onConfirm: () => Promise<boolean> }> = ({
  disabled = false,
  onConfirm,
}) => {
  const { t } = useTranslation('decision');
  const [confirming, setConfirming] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const confirm = async (): Promise<void> => {
    setSaving(true);
    await onConfirm();
    setSaving(false);
    setConfirming(false);
  };

  return (
    <div className="flex flex-col items-end gap-12">
      <Button
        color="vattjom"
        variant="primary"
        leftIcon={<Lock />}
        disabled={disabled || saving}
        onClick={() => {
          setConfirming(true);
        }}
      >
        {t('writeProtect.button')}
      </Button>
      {confirming ?
        <div className="flex flex-wrap items-center justify-end gap-12">
          <span>{t('writeProtect.confirm')}</span>
          <Button size="sm" color="vattjom" variant="primary" loading={saving} onClick={() => void confirm()}>
            {t('writeProtect.yes')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={() => {
              setConfirming(false);
            }}
          >
            {t('common:cancel')}
          </Button>
        </div>
      : null}
    </div>
  );
};
