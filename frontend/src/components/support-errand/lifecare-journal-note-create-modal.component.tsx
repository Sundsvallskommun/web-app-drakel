'use client';

import { createLifecareJournalNote, getLifecareJournalNoteTypes } from '@services/lifecare-documents-service';
import { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { LifecareRecordCreateModal, NewLifecareRecordValues } from './lifecare-record-create-modal.component';

/** Writes a new journalanteckning straight to the insats of the errand in Lifecare. */
export const LifecareJournalNoteCreateModal: FC<{ errandId: string; onClose: () => void; onCreated: () => void }> = ({
  errandId,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation('documentation');
  const loadTypes = useCallback(() => getLifecareJournalNoteTypes(errandId), [errandId]);
  const create = useCallback(
    (values: NewLifecareRecordValues) =>
      createLifecareJournalNote(errandId, {
        noteTypeCode: values.typeCode,
        title: values.title,
        occurenceDate: values.occurenceDate,
        occurenceTime: values.occurenceTime,
        content: values.content,
        protected: values.protected,
      }),
    [errandId]
  );

  return (
    <LifecareRecordCreateModal
      idPrefix="lifecare-journal-new"
      label={t('journal.newEntry')}
      withTime
      loadTypes={loadTypes}
      create={create}
      typesErrorText={t('lifecare.noteTypesError')}
      createErrorText={t('lifecare.createError')}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
};
