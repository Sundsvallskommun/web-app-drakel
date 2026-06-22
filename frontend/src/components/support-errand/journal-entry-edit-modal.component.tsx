'use client';

import { JournalEntry, JournalEntryInput, updateJournalEntry } from '@services/journal-service';
import { Button, Modal } from '@sk-web-gui/react';
import { FC, useState } from 'react';

import { JournalEntryFields, JournalEntryFieldValues, todayDate } from './journal-entry-fields.component';

/** Edit modal for a WORKING journalanteckning (the type stays fixed). */
export const JournalEntryEditModal: FC<{
  errandId: string;
  entry: JournalEntry;
  onClose: () => void;
  onSaved: () => void;
}> = ({ errandId, entry, onClose, onSaved }) => {
  const [fields, setFields] = useState<JournalEntryFieldValues>({
    heading: entry.heading ?? '',
    entryDate: entry.entryDate ?? todayDate(),
    entryTime: entry.entryTime ?? '',
    text: entry.text ?? '',
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const canSave = fields.heading.trim() !== '' && fields.entryDate !== '' && !saving;

  const save = async (): Promise<void> => {
    if (!entry.id || !canSave) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const input: JournalEntryInput = {
      type: entry.type ?? '',
      heading: fields.heading.trim(),
      text: fields.text.trim() || undefined,
      entryDate: fields.entryDate,
      entryTime: fields.entryTime || undefined,
    };
    const res = await updateJournalEntry(errandId, entry.id, input);
    setSaving(false);
    if (res.error) {
      setError('Det gick inte att spara ändringen');
      return;
    }
    onSaved();
  };

  return (
    <Modal show onClose={onClose} label="Redigera journalanteckning" className="w-[43rem]">
      <Modal.Content className="flex flex-col gap-12">
        <JournalEntryFields
          value={fields}
          idPrefix="journal-edit"
          onChange={(patch) => {
            setFields((prev) => ({ ...prev, ...patch }));
          }}
        />
        {error && <p className="text-error-surface-primary m-0">{error}</p>}
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Avbryt
        </Button>
        <Button color="vattjom" variant="primary" loading={saving} disabled={!canSave} onClick={() => void save()}>
          Spara
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
