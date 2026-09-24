'use client';

import { LifecareCalculationView } from '@data-contracts/backend/data-contracts';
import { saveLifecareCalculation } from '@services/lifecare-calculation-service';
import { Alert } from '@sk-web-gui/alert';
import { Button } from '@sk-web-gui/react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * "Spara normberäkning" and "Spara som slutlig" at the foot of the tab: send the draft to Lifecare — the
 * first time as a new beräkning, after that as a change to the same one — and say when it was last saved
 * there. Slutlig cannot be undone in Lifecare, so it asks first. A refusal is shown in Lifecare's or
 * Drakel's own words.
 */
export const LifecareCalculationSave: FC<{
  errandId: string;
  saved: LifecareCalculationView | null;
  disabled?: boolean;
  onSaved: () => void;
}> = ({ errandId, saved, disabled = false, onSaved }) => {
  const { t } = useTranslation('calculation');
  const [saving, setSaving] = useState<boolean>(false);
  const [confirmingFinal, setConfirmingFinal] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  const closed = disabled || saving || saved?.finalized === true;

  const save = async (finalize: boolean): Promise<void> => {
    setSaving(true);
    setError(undefined);
    setConfirmingFinal(false);
    const result = await saveLifecareCalculation(errandId, finalize);
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
        <div className="flex flex-wrap gap-12">
          <Button
            color="vattjom"
            variant="secondary"
            loading={saving}
            disabled={closed}
            onClick={() => void save(false)}
          >
            {t('lifecare.save')}
          </Button>
          <Button
            color="vattjom"
            variant="primary"
            disabled={closed}
            onClick={() => {
              setConfirmingFinal(true);
            }}
          >
            {t('lifecare.saveFinal')}
          </Button>
        </div>
      </div>
      {confirmingFinal ?
        <div className="flex flex-wrap items-center justify-end gap-12">
          <span>{t('lifecare.saveFinalConfirm')}</span>
          <Button size="sm" color="vattjom" variant="primary" loading={saving} onClick={() => void save(true)}>
            {t('lifecare.saveFinalYes')}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={() => {
              setConfirmingFinal(false);
            }}
          >
            {t('common:cancel')}
          </Button>
        </div>
      : null}
    </div>
  );
};
