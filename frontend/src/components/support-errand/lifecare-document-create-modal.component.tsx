'use client';

import { createLifecareDocument, getLifecareDocumentTypes } from '@services/lifecare-documents-service';
import { FC, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { LifecareRecordCreateModal, NewLifecareRecordValues } from './lifecare-record-create-modal.component';

/**
 * Writes a new document straight to the insats of the errand in Lifecare. The document types are the
 * ones Lifecare offers for the insats, blanketter left out — those are filled in in Lifecare.
 */
export const LifecareDocumentCreateModal: FC<{ errandId: string; onClose: () => void; onCreated: () => void }> = ({
  errandId,
  onClose,
  onCreated,
}) => {
  const { t } = useTranslation('documentation');
  const loadTypes = useCallback(() => getLifecareDocumentTypes(errandId), [errandId]);
  const create = useCallback(
    (values: NewLifecareRecordValues) =>
      createLifecareDocument(errandId, {
        documentTypeCode: values.typeCode,
        title: values.title,
        occurenceDate: values.occurenceDate,
        content: values.content,
        protected: values.protected,
      }),
    [errandId]
  );

  return (
    <LifecareRecordCreateModal
      idPrefix="lifecare-document-new"
      label={t('documents.newDocument')}
      withTime={false}
      loadTypes={loadTypes}
      create={create}
      typesErrorText={t('lifecare.documentTypesError')}
      createErrorText={t('lifecare.createDocumentError')}
      onClose={onClose}
      onCreated={onCreated}
    />
  );
};
