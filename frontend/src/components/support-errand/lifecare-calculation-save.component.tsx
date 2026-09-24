'use client';

import { LifecareCalculationView } from '@data-contracts/backend/data-contracts';
import { saveLifecareCalculation } from '@services/lifecare-calculation-service';
import { Alert } from '@sk-web-gui/alert';
import { Button } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * "Spara normberäkning" at the foot of the tab: sends the draft to Lifecare — the first time as a new
 * beräkning, after that as a change to the same one — and says when it was last saved there. A refusal is
 * shown in Lifecare's or Drakel's own words.
 */
export const LifecareCalculationSave: FC<{
  errandId: string;
  saved: LifecareCalculationView | null;
  disabled?: boolean;
  onSaved: () => void;
}> = ({ errandId, saved, disabled = false, onSaved }) => {
  const { t } = useTranslation('calculation');
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const save = async (): Promise<void> => {
    setSaving(true);
    setError(undefined);
    const result = await saveLifecareCalculation(errandId);
    setSaving(false);
    if (result.error) {
      setError(result.message ?? t('lifecare.saveError'));
      return;
    }
    onSaved();
  };

  return (
    <div className="flex flex-col gap-12">
      {error ?
        <Alert type="error">
          <Alert.Icon />
          <Alert.Content>
            <Alert.Content.Title className="font-bold">{t('lifecare.notSaved')}</Alert.Content.Title>
            <Alert.Content.Description>{error}</Alert.Content.Description>
          </Alert.Content>
        </Alert>
      : null}
      <div className="flex flex-wrap items-center justify-between gap-16">
        <p className="m-0 text-small text-dark-secondary">
          {saved ?
            saved.finalized ?
              t('lifecare.finalized')
            : t('lifecare.savedAt', { date: saved.updated, id: saved.id })
          : t('lifecare.notYetSaved')}
        </p>
        <Button
          color="vattjom"
          variant="primary"
          loading={saving}
          disabled={disabled || saving || saved?.finalized === true}
          onClick={() => void save()}
        >
          {t('lifecare.save')}
        </Button>
      </div>
    </div>
  );
};
