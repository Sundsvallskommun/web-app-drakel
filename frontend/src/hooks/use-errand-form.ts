'use client';

import { Errand, PatchErrandDto } from '@data-contracts/backend/data-contracts';
import { updateErrand } from '@services/errand-service/errand-service';
import { useEffect, useState } from 'react';

export interface ErrandForm {
  contactReason: string;
  description: string;
  assignedUserId: string;
  status: string;
  priority: string;
}

const fromErrand = (errand?: Errand): ErrandForm => ({
  contactReason: errand?.contactReason ?? '',
  description: errand?.description ?? '',
  assignedUserId: errand?.assignedUserId ?? '',
  status: errand?.status ?? '',
  priority: errand?.priority ?? '',
});

/**
 * Shared editable form for an errand. The state is lifted here so the single central "Spara ärende"
 * button (in the Handläggning sidebar) saves every edited field across the whole errand view —
 * mirroring draken, which has one save rather than per-section saves.
 */
export const useErrandForm = (errand: Errand | undefined, onSaved: () => void) => {
  const [form, setForm] = useState<ErrandForm>(() => fromErrand(errand));
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setForm(fromErrand(errand));
  }, [errand?.id, errand?.modified]);

  const setField = (key: keyof ErrandForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const initial = fromErrand(errand);
  const isDirty = (Object.keys(form) as (keyof ErrandForm)[]).some((key) => form[key] !== initial[key]);

  const save = async () => {
    if (!errand?.id) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const patch: PatchErrandDto = {
      contactReason: form.contactReason || undefined,
      description: form.description || undefined,
      assignedUserId: form.assignedUserId || undefined,
      status: form.status || undefined,
      priority: form.priority || undefined,
    };
    const result = await updateErrand(errand.id, patch);
    setSaving(false);
    if (result.error) {
      setError('Det gick inte att spara ärendet');
      return;
    }
    onSaved();
  };

  return { form, setField, isDirty, saving, error, save };
};
