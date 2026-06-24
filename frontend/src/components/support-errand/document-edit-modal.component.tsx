'use client';

import { Document, DocumentInput, updateDocument } from '@services/document-service';
import { Button, DatePicker, FormControl, FormLabel, Input, Modal } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { looksLikeHtml } from '@utils/sanitize-html';
import dynamic from 'next/dynamic';
import { FC, useState } from 'react';

import { todayDate } from './journal-entry-fields.component';

const DocumentEditor = dynamic(() => import('./document-editor.component'), {
  ssr: false,
  loading: () => <div className="h-[24rem] w-full animate-pulse rounded-12 bg-background-200" />,
});

const escapeHtml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Load the stored text into the editor: HTML as-is, older plain text turned into paragraphs so its line
// breaks survive.
const toEditorMarkup = (text: string): string =>
  !text ? ''
  : looksLikeHtml(text) ? text
  : text
      .split('\n')
      .map((line) => `<p>${line ? escapeHtml(line) : '<br>'}</p>`)
      .join('');

/** Edit modal for a WORKING dokument (the type stays fixed). The text is edited in the WYSIWYG editor. */
export const DocumentEditModal: FC<{
  errandId: string;
  document: Document;
  onClose: () => void;
  onSaved: () => void;
}> = ({ errandId, document, onClose, onSaved }) => {
  const [heading, setHeading] = useState<string>(document.heading ?? '');
  const [documentDate, setDocumentDate] = useState<string>(document.documentDate ?? todayDate());
  const [documentTime, setDocumentTime] = useState<string>(document.documentTime ?? '');
  const [content, setContent] = useState<TextEditorValue>({ markup: toEditorMarkup(document.text ?? '') });
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const canSave = heading.trim() !== '' && documentDate !== '' && !saving;

  const save = async (): Promise<void> => {
    if (!document.id || !canSave) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const trimmedMarkup = content.markup?.trim() ?? '';
    const input: DocumentInput = {
      type: document.type ?? '',
      heading: heading.trim(),
      text: trimmedMarkup.length > 0 ? trimmedMarkup : undefined,
      documentDate,
      documentTime: documentTime || undefined,
    };
    const res = await updateDocument(errandId, document.id, input);
    setSaving(false);
    if (res.error) {
      setError('Det gick inte att spara ändringen');
      return;
    }
    onSaved();
  };

  return (
    <Modal show onClose={onClose} label="Redigera dokument" className="w-[64rem]">
      <Modal.Content className="flex flex-col gap-12">
        <FormControl id="document-edit-heading" className="w-full">
          <FormLabel>Rubrik *</FormLabel>
          <Input
            value={heading}
            onChange={(event) => {
              setHeading(event.target.value);
            }}
          />
        </FormControl>

        <div className="grid grid-cols-2 gap-12">
          <FormControl id="document-edit-date" className="w-full">
            <FormLabel>Datum *</FormLabel>
            <DatePicker
              type="date"
              value={documentDate}
              onChange={(event) => {
                setDocumentDate(event.target.value);
              }}
            />
          </FormControl>
          <FormControl id="document-edit-time" className="w-full">
            <FormLabel>Tid</FormLabel>
            <DatePicker
              type="time"
              value={documentTime}
              onChange={(event) => {
                setDocumentTime(event.target.value);
              }}
            />
          </FormControl>
        </div>

        <FormControl id="document-edit-text" className="w-full">
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
