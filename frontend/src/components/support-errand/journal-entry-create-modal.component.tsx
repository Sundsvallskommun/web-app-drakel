'use client';

import { createJournalEntry, JournalEntryInput, JournalEntryType } from '@services/journal-service';
import { Button, FormControl, FormLabel, Modal, Select } from '@sk-web-gui/react';
import { FC, useState } from 'react';

import { JournalEntryFields, JournalEntryFieldValues, todayDate } from './journal-entry-fields.component';

/** Modal for adding a new journalanteckning (type dropdown + shared fields). */
export const JournalEntryCreateModal: FC<{
  errandId: string;
  types: JournalEntryType[];
  onClose: () => void;
  onCreated: () => void;
}> = ({ errandId, types, onClose, onCreated }) => {
  const [type, setType] = useState<string>('');
  const [fields, setFields] = useState<JournalEntryFieldValues>({
    heading: '',
    entryDate: todayDate(),
    entryTime: '',
    text: '',
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const canCreate = type !== '' && fields.heading.trim() !== '' && fields.entryDate !== '' && !saving;

  const create = async (): Promise<void> => {
    if (!canCreate) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const input: JournalEntryInput = {
      type,
      heading: fields.heading.trim(),
      text: fields.text.trim() || undefined,
      entryDate: fields.entryDate,
      entryTime: fields.entryTime || undefined,
    };
    const res = await createJournalEntry(errandId, input);
    setSaving(false);
    if (res.error) {
      setError('Det gick inte att spara journalanteckningen');
      return;
    }
    onCreated();
  };

  return (
    <Modal show onClose={onClose} label="Ny journalanteckning" className="w-[43rem]">
      <Modal.Content className="flex flex-col gap-12">
        <FormControl id="journal-new-type" className="w-full">
          <FormLabel>Typ *</FormLabel>
          <Select
            className="w-full"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
            }}
          >
            <Select.Option value="">Välj typ</Select.Option>
            {types.map((journalType) => (
              <Select.Option key={journalType.code} value={journalType.displayName ?? ''}>
                {journalType.displayName ?? journalType.code}
              </Select.Option>
            ))}
          </Select>
        </FormControl>
        <JournalEntryFields
          value={fields}
          idPrefix="journal-new"
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
        <Button color="vattjom" variant="primary" loading={saving} disabled={!canCreate} onClick={() => void create()}>
          Skapa
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
