'use client';

import { LifecareNoteTypeView } from '@data-contracts/backend/data-contracts';
import { createLifecareJournalNote, getLifecareJournalNoteTypes } from '@services/lifecare-documents-service';
import { Button, DatePicker, FormControl, FormLabel, Input, Modal, Select } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { todayDate } from '@utils/today-date';
import dynamic from 'next/dynamic';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const DocumentEditor = dynamic(() => import('./document-editor.component'), {
  ssr: false,
  loading: () => <div className="h-[24rem] w-full animate-pulse rounded-12 bg-background-200" />,
});

const EMPTY_CONTENT: TextEditorValue = { markup: '', plainText: '' };

/**
 * Writes a new journalanteckning straight to the insats of the errand in Lifecare. The note types are
 * Lifecare's own, read from its proposal for the insats. Picking a type fills the rubrik with its name,
 * as Lifecare's own editor does, until the handläggare writes a rubrik of their own.
 *
 * Nothing is kept outside Lifecare, so the dialog stays open with the text intact until Lifecare has
 * accepted the note, and a refusal is shown in Lifecare's own words.
 */
export const LifecareJournalNoteCreateModal: FC<{ errandId: string; onClose: () => void; onCreated: () => void }> = ({
  errandId,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation('documentation');
  const [noteTypes, setNoteTypes] = useState<LifecareNoteTypeView[]>([]);
  const [noteTypeCode, setNoteTypeCode] = useState<string>('');
  const [heading, setHeading] = useState<string>('');
  // Once the handläggare has written a rubrik, picking another type no longer replaces it.
  const [headingEdited, setHeadingEdited] = useState<boolean>(false);
  const [occurenceDate, setOccurenceDate] = useState<string>(todayDate());
  const [occurenceTime, setOccurenceTime] = useState<string>('');
  const [content, setContent] = useState<TextEditorValue>(EMPTY_CONTENT);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    void getLifecareJournalNoteTypes(errandId).then((res) => {
      if (!active) {
        return;
      }
      if (res.error || !res.data) {
        setError(res.message ?? t('lifecare.noteTypesError'));
        return;
      }
      setNoteTypes(res.data);
    });
    return () => {
      active = false;
    };
  }, [errandId, t]);

  const hasText = (content.plainText ?? content.markup ?? '').trim() !== '';
  const canCreate = noteTypeCode !== '' && heading.trim() !== '' && occurenceDate !== '' && hasText && !saving;

  const pickNoteType = (code: string): void => {
    setNoteTypeCode(code);
    if (!headingEdited) {
      setHeading(noteTypes.find((noteType) => String(noteType.code) === code)?.name ?? '');
    }
  };

  const create = async (): Promise<void> => {
    if (!canCreate) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const res = await createLifecareJournalNote(errandId, {
      noteTypeCode: Number(noteTypeCode),
      title: heading.trim(),
      occurenceDate,
      occurenceTime: occurenceTime || undefined,
      content: content.markup?.trim() ?? '',
    });
    setSaving(false);
    if (res.error) {
      // Lifecare's own reason when it gave one; the text stays in the editor either way.
      setError(res.message ?? t('lifecare.createError'));
      return;
    }
    onCreated();
  };

  return (
    <Modal show onClose={onClose} label={t('journal.newEntry')} className="w-[88rem] max-w-[90vw]">
      <Modal.Content className="flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <FormControl id="lifecare-journal-new-type" className="w-full">
            <FormLabel>{t('form.typeRequired')}</FormLabel>
            <Select
              className="w-full"
              value={noteTypeCode}
              onChange={(event) => {
                pickNoteType(event.target.value);
              }}
            >
              <Select.Option value="">{t('form.selectType')}</Select.Option>
              {noteTypes.map((noteType) => (
                <Select.Option key={noteType.code} value={String(noteType.code)}>
                  {noteType.name}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
          <FormControl id="lifecare-journal-new-heading" className="w-full">
            <FormLabel>{t('form.headingRequired')}</FormLabel>
            <Input
              value={heading}
              onChange={(event) => {
                setHeading(event.target.value);
                setHeadingEdited(true);
              }}
            />
          </FormControl>
          <FormControl id="lifecare-journal-new-date" className="w-full">
            <FormLabel>{t('form.dateRequired')}</FormLabel>
            <DatePicker
              type="date"
              value={occurenceDate}
              onChange={(event) => {
                setOccurenceDate(event.target.value);
              }}
            />
          </FormControl>
          <FormControl id="lifecare-journal-new-time" className="w-full">
            <FormLabel>{t('form.time')}</FormLabel>
            <DatePicker
              type="time"
              value={occurenceTime}
              onChange={(event) => {
                setOccurenceTime(event.target.value);
              }}
            />
          </FormControl>
        </div>

        <FormControl id="lifecare-journal-new-text" className="w-full">
          <FormLabel>{t('form.text')}</FormLabel>
          <DocumentEditor value={content} onChange={setContent} />
        </FormControl>

        {error ?
          <p className="text-error-surface-primary m-0">{error}</p>
        : null}
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {t('common:cancel')}
        </Button>
        <Button color="vattjom" variant="primary" loading={saving} disabled={!canCreate} onClick={() => void create()}>
          {t('form.create')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
