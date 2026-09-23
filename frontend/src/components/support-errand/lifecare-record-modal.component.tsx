'use client';

import {
  getLifecareRecordContent,
  LifecareRecord,
  LifecareRecordEdit,
  updateLifecareRecord,
} from '@services/lifecare-documents-service';
import { Button, DatePicker, FormControl, FormLabel, Modal, Spinner } from '@sk-web-gui/react';
import { TextEditorValue } from '@sk-web-gui/text-editor';
import { toEditorMarkup } from '@utils/sanitize-html';
import dynamic from 'next/dynamic';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RecordBodyText } from './record-body-text.component';

const DocumentEditor = dynamic(() => import('./document-editor.component'), {
  ssr: false,
  loading: () => <div className="h-[24rem] w-full animate-pulse rounded-12 bg-background-200" />,
});

/**
 * Opens one Lifecare record: reads its body, shows it, and — when Lifecare still allows it — lets it
 * be edited and saved back. Editability is decided by Lifecare (the `editable` flag on the fetched
 * record), never guessed from the list, so a record finalised since the tab loaded is read-only here.
 */
export const LifecareRecordModal: FC<{ record: LifecareRecord; onClose: () => void; onSaved: () => void }> = ({
  record,
  onClose,
  onSaved,
}) => {
  const { t } = useTranslation('documentation');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [editable, setEditable] = useState<boolean>(false);
  const [occurenceDate, setOccurenceDate] = useState<string>('');
  const [time, setTime] = useState<string>('');
  const [content, setContent] = useState<TextEditorValue>({ markup: '' });
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    void getLifecareRecordContent(record.category, record.id).then((res) => {
      if (!active) {
        return;
      }
      if (res.error || !res.data) {
        setLoadError(true);
        setIsLoading(false);
        return;
      }
      setEditable(res.data.editable);
      setOccurenceDate(res.data.occurenceDate);
      setTime(res.data.time);
      setContent({ markup: toEditorMarkup(res.data.content) });
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [record.category, record.id]);

  const save = async (): Promise<void> => {
    setSaving(true);
    setSaveError(false);
    const edit: LifecareRecordEdit = {
      content: content.markup?.trim() ?? '',
      occurenceDate: occurenceDate || undefined,
      time: time || undefined,
    };
    const res = await updateLifecareRecord(record.category, record.id, edit);
    setSaving(false);
    if (res.error) {
      setSaveError(true);
      return;
    }
    onSaved();
  };

  const label =
    record.category === 'JOURNAL_NOTE' ? t('lifecare.journalRecordTitle') : t('lifecare.documentRecordTitle');

  return (
    <Modal show onClose={onClose} label={label} className="w-[88rem] max-w-[90vw]">
      <Modal.Content className="flex flex-col gap-12">
        <h3 className="m-0 text-large font-bold break-words">{record.title}</h3>

        {isLoading ?
          <div className="flex justify-center py-40">
            <Spinner />
          </div>
        : loadError ?
          <p className="text-error-surface-primary m-0">{t('lifecare.loadError')}</p>
        : <>
            <div className="grid grid-cols-2 gap-12">
              <FormControl id="lifecare-record-date" className="w-full">
                <FormLabel>{t('form.dateRequired')}</FormLabel>
                <DatePicker
                  type="date"
                  value={occurenceDate}
                  disabled={!editable}
                  onChange={(event) => {
                    setOccurenceDate(event.target.value);
                  }}
                />
              </FormControl>
              <FormControl id="lifecare-record-time" className="w-full">
                <FormLabel>{t('form.time')}</FormLabel>
                <DatePicker
                  type="time"
                  value={time}
                  disabled={!editable}
                  onChange={(event) => {
                    setTime(event.target.value);
                  }}
                />
              </FormControl>
            </div>

            <FormControl id="lifecare-record-text" className="w-full">
              <FormLabel>{t('form.text')}</FormLabel>
              {editable ?
                <DocumentEditor value={content} onChange={setContent} />
              : <div className="rounded-12 border border-divider p-16">
                  <RecordBodyText text={content.markup} />
                </div>
              }
            </FormControl>

            {!editable && <p className="m-0 text-small text-dark-secondary">{t('lifecare.readOnly')}</p>}
            {saveError && <p className="text-error-surface-primary m-0">{t('lifecare.saveError')}</p>}
          </>
        }
      </Modal.Content>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          {editable ? t('common:cancel') : t('common:close')}
        </Button>
        {editable && (
          <Button
            color="vattjom"
            variant="primary"
            loading={saving}
            disabled={isLoading || loadError}
            onClick={() => void save()}
          >
            {t('common:save')}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};
