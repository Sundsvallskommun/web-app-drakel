'use client';

import { Document, DocumentInput, updateDocument } from '@services/document-service';
import { Button, DatePicker, FormControl, FormLabel, Input, Modal } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { combineDateAndTime, splitDateTime } from '@utils/date-time';
import { toEditorMarkup } from '@utils/sanitize-html';
import { todayDate } from '@utils/today-date';
import dynamic from 'next/dynamic';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DocumentEditor = dynamic(() => import('./document-editor.component'), {
  ssr: false,
  loading: () => <div className="h-[24rem] w-full animate-pulse rounded-12 bg-background-200" />,
});

/** Edit modal for a WORKING dokument (the type stays fixed). The text is edited in the WYSIWYG editor. */
export const DocumentEditModal: FC<{
  errandId: string;
  document: Document;
  onClose: () => void;
  onSaved: () => void;
}> = ({ errandId, document, onClose, onSaved }) => {
  const { t } = useTranslation('documentation');
  const documented = splitDateTime(document.documentDateTime);
  const [heading, setHeading] = useState<string>(document.heading ?? '');
  const [documentDate, setDocumentDate] = useState<string>(documented.date || todayDate());
  const [documentTime, setDocumentTime] = useState<string>(documented.time);
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
      documentDateTime: combineDateAndTime(documentDate, documentTime),
    };
    const res = await updateDocument(errandId, document.id, input);
    setSaving(false);
    if (res.error) {
      setError(t('form.saveChangeError'));
      return;
    }
    onSaved();
  };

  return (
    <Modal show onClose={onClose} label={t('documents.editTitle')} className="w-[88rem] max-w-[90vw]">
      <Modal.Content className="flex flex-col gap-12">
        <FormControl id="document-edit-heading" className="w-full">
          <FormLabel>{t('form.headingRequired')}</FormLabel>
          <Input
            value={heading}
            onChange={(event) => {
              setHeading(event.target.value);
            }}
          />
        </FormControl>

        <div className="grid grid-cols-2 gap-12">
          <FormControl id="document-edit-date" className="w-full">
            <FormLabel>{t('form.dateRequired')}</FormLabel>
            <DatePicker
              type="date"
              value={documentDate}
              onChange={(event) => {
                setDocumentDate(event.target.value);
              }}
            />
          </FormControl>
          <FormControl id="document-edit-time" className="w-full">
            <FormLabel>{t('form.time')}</FormLabel>
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
          <FormLabel>{t('form.text')}</FormLabel>
          <DocumentEditor value={content} onChange={setContent} />
        </FormControl>

        {error && <p className="text-error-surface-primary m-0">{error}</p>}
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {t('common:cancel')}
        </Button>
        <Button color="vattjom" variant="primary" loading={saving} disabled={!canSave} onClick={() => void save()}>
          {t('common:save')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
