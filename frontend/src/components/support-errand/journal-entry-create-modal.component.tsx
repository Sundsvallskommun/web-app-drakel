'use client';

import {
  DocumentTemplates,
  getDocumentTemplateContent,
  getDocumentTemplates,
} from '@services/document-template-service';
import { createJournalEntry, JournalEntryInput, JournalEntryType } from '@services/journal-service';
import { Button, Combobox, DatePicker, FormControl, FormLabel, Input, Modal, Select } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { todayDate } from '@utils/today-date';
import dynamic from 'next/dynamic';
import { FC, useCallback, useEffect, useRef, useState } from 'react';

// The rich-text editor + template/phrase pickers are shared with the document editor (the templating
// service filters by the type code, and journal/document type codes don't overlap).
const DocumentEditor = dynamic(() => import('./document-editor.component'), {
  ssr: false,
  loading: () => <div className="h-[24rem] w-full animate-pulse rounded-12 bg-background-200" />,
});

const EMPTY_TEMPLATES: DocumentTemplates = { documents: [], phrases: [] };
const EMPTY_CONTENT: TextEditorValue = { markup: '', plainText: '' };

// A single-select combobox reports its value as a string; guard against the array shape just in case.
const comboboxValue = (value: unknown): string =>
  typeof value === 'string' ? value
  : Array.isArray(value) && typeof value[0] === 'string' ? value[0]
  : '';

/**
 * Modal for adding a new journalanteckning. Picking a type loads the templates tagged with that type code
 * from the Templating service: a "Mall" combobox (selecting one fills the rubrik and replaces the editor
 * body) and a "Frastext" combobox (selecting one inserts the phrase at the cursor). The composed HTML is
 * saved to caremanagement as the entry text.
 */
export const JournalEntryCreateModal: FC<{
  errandId: string;
  types: JournalEntryType[];
  onClose: () => void;
  onCreated: () => void;
}> = ({ errandId, types, onClose, onCreated }) => {
  const [typeCode, setTypeCode] = useState<string>('');
  const [heading, setHeading] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(todayDate());
  const [entryTime, setEntryTime] = useState<string>('');
  const [content, setContent] = useState<TextEditorValue>(EMPTY_CONTENT);
  const [templates, setTemplates] = useState<DocumentTemplates>(EMPTY_TEMPLATES);
  // Bumped after every phrase insert so the Frastext combobox remounts and clears (letting the same phrase
  // be inserted again).
  const [phraseNonce, setPhraseNonce] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  // next/dynamic doesn't forward refs, so the editor hands us its "insert at cursor" function here.
  const insertAtCursor = useRef<((html: string) => void) | null>(null);
  const registerInsert = useCallback((insert: (html: string) => void) => {
    insertAtCursor.current = insert;
  }, []);

  useEffect(() => {
    if (!typeCode) {
      setTemplates(EMPTY_TEMPLATES);
      return;
    }
    void getDocumentTemplates(typeCode).then((res) => {
      setTemplates(res.error ? EMPTY_TEMPLATES : (res.data ?? EMPTY_TEMPLATES));
    });
  }, [typeCode]);

  const selectedType = types.find((type) => type.code === typeCode);

  const applyTemplate = (identifier: string): void => {
    const option = templates.documents.find((template) => template.identifier === identifier);
    if (option?.name) {
      setHeading(option.name);
    }
    void getDocumentTemplateContent(identifier).then((res) => {
      if (!res.error && res.data !== undefined) {
        setContent({ markup: res.data });
      }
    });
  };

  const insertPhrase = (identifier: string): void => {
    void getDocumentTemplateContent(identifier).then((res) => {
      if (!res.error && res.data) {
        insertAtCursor.current?.(res.data);
      }
    });
    setPhraseNonce((nonce) => nonce + 1);
  };

  const canCreate = typeCode !== '' && heading.trim() !== '' && entryDate !== '' && !saving;

  const create = async (): Promise<void> => {
    if (!canCreate) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const trimmedMarkup = content.markup?.trim() ?? '';
    const input: JournalEntryInput = {
      type: selectedType?.displayName ?? '',
      heading: heading.trim(),
      text: trimmedMarkup.length > 0 ? trimmedMarkup : undefined,
      entryDate,
      entryTime: entryTime || undefined,
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
    <Modal show onClose={onClose} label="Ny journalanteckning" className="w-[88rem] max-w-[90vw]">
      <Modal.Content className="flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <FormControl id="journal-new-type" className="w-full">
            <FormLabel>Typ *</FormLabel>
            <Select
              className="w-full"
              value={typeCode}
              onChange={(event) => {
                setTypeCode(event.target.value);
              }}
            >
              <Select.Option value="">Välj typ</Select.Option>
              {types.map((journalType) => (
                <Select.Option key={journalType.code} value={journalType.code ?? ''}>
                  {journalType.displayName ?? journalType.code}
                </Select.Option>
              ))}
            </Select>
          </FormControl>

          <FormControl id="journal-new-template" className="w-full">
            <FormLabel>Mall</FormLabel>
            <Combobox
              key={`doc-${typeCode}`}
              disabled={!typeCode}
              placeholder="Välj mall (ersätter texten)"
              searchPlaceholder="Sök mall…"
              onSelect={(event) => {
                const identifier = comboboxValue(event.target.value);
                if (identifier) {
                  applyTemplate(identifier);
                }
              }}
            >
              <Combobox.Input className="w-full" />
              <Combobox.List>
                {templates.documents.map((template) => (
                  <Combobox.Option key={template.identifier} value={template.identifier ?? ''}>
                    {template.name ?? template.identifier ?? ''}
                  </Combobox.Option>
                ))}
              </Combobox.List>
            </Combobox>
          </FormControl>

          <FormControl id="journal-new-phrase" className="w-full">
            <FormLabel>Frastext</FormLabel>
            <Combobox
              key={`phrase-${typeCode}-${phraseNonce}`}
              disabled={!typeCode}
              placeholder="Infoga fras vid markören"
              searchPlaceholder="Sök fras…"
              onSelect={(event) => {
                const identifier = comboboxValue(event.target.value);
                if (identifier) {
                  insertPhrase(identifier);
                }
              }}
            >
              <Combobox.Input className="w-full" />
              <Combobox.List>
                {templates.phrases.map((template) => (
                  <Combobox.Option key={template.identifier} value={template.identifier ?? ''}>
                    {template.name ?? template.identifier ?? ''}
                  </Combobox.Option>
                ))}
              </Combobox.List>
            </Combobox>
          </FormControl>
        </div>

        <FormControl id="journal-new-heading" className="w-full">
          <FormLabel>Rubrik *</FormLabel>
          <Input
            value={heading}
            onChange={(event) => {
              setHeading(event.target.value);
            }}
          />
        </FormControl>

        <div className="grid grid-cols-2 gap-12">
          <FormControl id="journal-new-date" className="w-full">
            <FormLabel>Datum *</FormLabel>
            <DatePicker
              type="date"
              value={entryDate}
              onChange={(event) => {
                setEntryDate(event.target.value);
              }}
            />
          </FormControl>
          <FormControl id="journal-new-time" className="w-full">
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

        <FormControl id="journal-new-text" className="w-full">
          <FormLabel>Text</FormLabel>
          <DocumentEditor value={content} onChange={setContent} registerInsert={registerInsert} />
        </FormControl>

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
