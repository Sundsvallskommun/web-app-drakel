'use client';

import { JournalEntry, JournalEntryInput, updateJournalEntry } from '@services/journal-service';
import { Button, DatePicker, FormControl, FormLabel, Input, Modal } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { toEditorMarkup } from '@utils/sanitize-html';
import { todayDate } from '@utils/today-date';
import dynamic from 'next/dynamic';
import { FC, useState } from 'react';

const DocumentEditor = dynamic(() => import('./document-editor.component'), {
  ssr: false,
  loading: () => <div className="h-[24rem] w-full animate-pulse rounded-12 bg-background-200" />,
});

/** Edit modal for a WORKING journalanteckning (the type stays fixed). The text is edited in the WYSIWYG editor. */
export const JournalEntryEditModal: FC<{
  errandId: string;
  entry: JournalEntry;
  onClose: () => void;
  onSaved: () => void;
}> = ({ errandId, entry, onClose, onSaved }) => {
  const [heading, setHeading] = useState<string>(entry.heading ?? '');
  const [entryDate, setEntryDate] = useState<string>(entry.entryDate ?? todayDate());
  const [entryTime, setEntryTime] = useState<string>(entry.entryTime ?? '');
  const [content, setContent] = useState<TextEditorValue>({ markup: toEditorMarkup(entry.text ?? '') });
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const canSave = heading.trim() !== '' && entryDate !== '' && !saving;

  const save = async (): Promise<void> => {
    if (!entry.id || !canSave) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const trimmedMarkup = content.markup?.trim() ?? '';
    const input: JournalEntryInput = {
      type: entry.type ?? '',
      heading: heading.trim(),
      text: trimmedMarkup.length > 0 ? trimmedMarkup : undefined,
      entryDate,
      entryTime: entryTime || undefined,
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
    <Modal show onClose={onClose} label="Redigera journalanteckning" className="w-[64rem]">
      <Modal.Content className="flex flex-col gap-12">
        <FormControl id="journal-edit-heading" className="w-full">
          <FormLabel>Rubrik *</FormLabel>
          <Input
            value={heading}
            onChange={(event) => {
              setHeading(event.target.value);
            }}
          />
        </FormControl>

        <div className="grid grid-cols-2 gap-12">
          <FormControl id="journal-edit-date" className="w-full">
            <FormLabel>Datum *</FormLabel>
            <DatePicker
              type="date"
              value={entryDate}
              onChange={(event) => {
                setEntryDate(event.target.value);
              }}
            />
          </FormControl>
          <FormControl id="journal-edit-time" className="w-full">
            <FormLabel>Tid</FormLabel>
            <DatePicker
              type="time"
              value={entryTime}
              onChange={(event) => {
                setEntryTime(event.target.value);
              }}
            />
          </FormControl>
        </div>

        <FormControl id="journal-edit-text" className="w-full">
          <FormLabel>Text</FormLabel>
          <DocumentEditor value={content} onChange={setContent} />
        </FormControl>

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
