'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { updateErrand } from '@services/errand-service/errand-service';
import { buildErrandPatch, ErrandForm } from '@utils/errand-patch';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type { ErrandForm };

const fromErrand = (errand?: Errand): ErrandForm => ({
  assignedUserId: errand?.assignedUserId ?? '',
  status: errand?.status ?? '',
});

/**
 * Shared editable form for an errand. The state is lifted here so the single central "Spara ärende"
 * button (in the Handläggning sidebar) saves every edited field across the whole errand view —
 * mirroring draken, which has one save rather than per-section saves. A save only sends the fields that
 * changed, and nothing at all when none did.
 */
export const useErrandForm = (errand: Errand | undefined, onSaved: () => void) => {
  const { t } = useTranslation('errand');
  const [form, setForm] = useState<ErrandForm>(() => fromErrand(errand));
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setForm(fromErrand(errand));
  }, [errand?.id, errand?.modified]);

  const setField = (key: keyof ErrandForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const patch = buildErrandPatch(form, fromErrand(errand));
  const isDirty = Object.keys(patch).length > 0;

  const save = async () => {
    if (!errand?.id || !isDirty) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const result = await updateErrand(errand.id, patch);
    setSaving(false);
    if (result.error) {
      setError(t('form.saveError'));
      return;
    }
    onSaved();
  };

  return { form, setField, isDirty, saving, error, save };
};
