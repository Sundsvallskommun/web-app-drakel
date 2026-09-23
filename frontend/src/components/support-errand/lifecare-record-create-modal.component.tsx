'use client';

import { ServiceResponse } from '@interfaces/services';
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

/** A type Lifecare offers for a new record — a note type or a document type. */
interface LifecareRecordType {
  code: number;
  name: string;
  /** False when the type keeps the date Lifecare proposes (today). */
  canChangeOccurenceDate?: boolean;
}

/** What the handläggare filled in, handed to the record kind's own create call. */
export interface NewLifecareRecordValues {
  typeCode: number;
  title: string;
  occurenceDate: string;
  occurenceTime?: string;
  content: string;
}

interface LifecareRecordCreateModalProps {
  /** Prefix for the form field ids. */
  idPrefix: string;
  label: string;
  /** Whether the record carries a time of its own (journalanteckningar do, documents do not). */
  withTime: boolean;
  /** Reads the types Lifecare offers. Keep it stable (useCallback) — it is re-run when it changes. */
  loadTypes: () => Promise<ServiceResponse<LifecareRecordType[]>>;
  create: (values: NewLifecareRecordValues) => Promise<ServiceResponse<null>>;
  typesErrorText: string;
  createErrorText: string;
  onClose: () => void;
  onCreated: () => void;
}

/**
 * Writes a new record straight to the insats of the errand in Lifecare. The types are Lifecare's own,
 * read from its proposal for the insats. Picking a type fills the rubrik with its name, as Lifecare's own
 * editor does, until the handläggare writes a rubrik of their own.
 *
 * Nothing is kept outside Lifecare, so the dialog stays open with the text intact until Lifecare has
 * accepted the record, and a refusal is shown in Lifecare's own words.
 */
export const LifecareRecordCreateModal: FC<LifecareRecordCreateModalProps> = ({
  idPrefix,
  label,
  withTime,
  loadTypes,
  create,
  typesErrorText,
  createErrorText,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation('documentation');
  const [recordTypes, setRecordTypes] = useState<LifecareRecordType[]>([]);
  const [typeCode, setTypeCode] = useState<string>('');
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
    void loadTypes().then((res) => {
      if (!active) {
        return;
      }
      if (res.error || !res.data) {
        setError(res.message ?? typesErrorText);
        return;
      }
      setRecordTypes(res.data);
    });
    return () => {
      active = false;
    };
  }, [loadTypes, typesErrorText]);

  const pickedType = recordTypes.find((recordType) => String(recordType.code) === typeCode);
  const dateLocked = pickedType?.canChangeOccurenceDate === false;
  const hasText = (content.plainText ?? content.markup ?? '').trim() !== '';
  const canCreate = typeCode !== '' && heading.trim() !== '' && occurenceDate !== '' && hasText && !saving;

  const pickType = (code: string): void => {
    setTypeCode(code);
    const recordType = recordTypes.find((candidate) => String(candidate.code) === code);
    if (!headingEdited) {
      setHeading(recordType?.name ?? '');
    }
    if (recordType?.canChangeOccurenceDate === false) {
      setOccurenceDate(todayDate());
    }
  };

  const submit = async (): Promise<void> => {
    if (!canCreate) {
      return;
    }
    setSaving(true);
    setError(undefined);
    const res = await create({
      typeCode: Number(typeCode),
      title: heading.trim(),
      occurenceDate,
      occurenceTime: withTime && occurenceTime ? occurenceTime : undefined,
      content: content.markup?.trim() ?? '',
    });
    setSaving(false);
    if (res.error) {
      // Lifecare's own reason when it gave one; the text stays in the editor either way.
      setError(res.message ?? createErrorText);
      return;
    }
    onCreated();
  };

  return (
    <Modal show onClose={onClose} label={label} className="w-[88rem] max-w-[90vw]">
      <Modal.Content className="flex flex-col gap-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <FormControl id={`${idPrefix}-type`} className="w-full">
            <FormLabel>{t('form.typeRequired')}</FormLabel>
            <Select
              className="w-full"
              value={typeCode}
              onChange={(event) => {
                pickType(event.target.value);
              }}
            >
              <Select.Option value="">{t('form.selectType')}</Select.Option>
              {recordTypes.map((recordType) => (
                <Select.Option key={recordType.code} value={String(recordType.code)}>
                  {recordType.name}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
          <FormControl id={`${idPrefix}-heading`} className="w-full">
            <FormLabel>{t('form.headingRequired')}</FormLabel>
            <Input
              value={heading}
              onChange={(event) => {
                setHeading(event.target.value);
                setHeadingEdited(true);
              }}
            />
          </FormControl>
          <FormControl id={`${idPrefix}-date`} className="w-full" disabled={dateLocked}>
            <FormLabel>{t('form.dateRequired')}</FormLabel>
            <DatePicker
              type="date"
              value={occurenceDate}
              onChange={(event) => {
                setOccurenceDate(event.target.value);
              }}
            />
          </FormControl>
          {withTime ?
            <FormControl id={`${idPrefix}-time`} className="w-full">
              <FormLabel>{t('form.time')}</FormLabel>
              <DatePicker
                type="time"
                value={occurenceTime}
                onChange={(event) => {
                  setOccurenceTime(event.target.value);
                }}
              />
            </FormControl>
          : null}
        </div>

        <FormControl id={`${idPrefix}-text`} className="w-full">
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
        <Button color="vattjom" variant="primary" loading={saving} disabled={!canCreate} onClick={() => void submit()}>
          {t('form.create')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
