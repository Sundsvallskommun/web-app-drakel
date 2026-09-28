'use client';

import { useLifecareDocuments } from '@hooks/use-lifecare-documents';
import { Button, Spinner } from '@sk-web-gui/react';
import { FileText, Plus } from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/** A Lifecare document chosen to go with the beslut. */
export interface LifecareDocumentChoice {
  id: string;
  title: string;
}

/**
 * The sökandes documents in Lifecare — stored PDFs such as inkomna handlingar, written documents and blanketter — to add
 * to "Skicka beräkning och beslut". Lifecare prints each as a PDF when the beslut is sent. Read when the picker opens.
 */
export const LifecareDocumentPicker: FC<{
  errandId: string;
  /** The documents already chosen, which are not offered again. */
  chosenIds: string[];
  onPick: (document: LifecareDocumentChoice) => void;
}> = ({ errandId, chosenIds, onPick }) => {
  const { t } = useTranslation('errand');
  const { records, isLoading, error } = useLifecareDocuments(errandId);
  const offeredDocuments = records.documents.filter((document) => !chosenIds.includes(document.id));

  if (isLoading) {
    return <Spinner size={2} aria-label={t('decideAndPay.attachments.lifecareLoading')} />;
  }
  if (error) {
    return <p className="m-0 text-small text-error-surface-primary">{t('decideAndPay.attachments.lifecareError')}</p>;
  }
  if (offeredDocuments.length === 0) {
    return <p className="m-0 text-small text-dark-secondary">{t('decideAndPay.attachments.lifecareNone')}</p>;
  }

  return (
    <ul
      className="m-0 p-0 list-none flex flex-col gap-4 max-h-[24rem] overflow-y-auto"
      aria-label={t('decideAndPay.attachments.lifecareDocuments')}
    >
      {offeredDocuments.map((document) => (
        <li key={document.id} className="flex items-center gap-12 px-12 py-6 rounded-8 hover:bg-background-200">
          <FileText className="shrink-0 w-20 h-20 text-dark-secondary" aria-hidden />
          <span className="min-w-0 flex-1 truncate" title={document.title}>
            {document.title}
          </span>
          <span className="shrink-0 text-small text-dark-secondary tabular-nums">{document.dateTime.slice(0, 10)}</span>
          <Button
            size="sm"
            variant="tertiary"
            leftIcon={<Plus />}
            aria-label={t('decideAndPay.attachments.add', { name: document.title })}
            onClick={() => {
              onPick({ id: document.id, title: document.title });
            }}
          >
            {t('decideAndPay.attachments.addShort')}
          </Button>
        </li>
      ))}
    </ul>
  );
};
