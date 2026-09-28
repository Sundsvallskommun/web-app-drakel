'use client';

import { useLifecareDocuments } from '@hooks/use-lifecare-documents';
import { Button, Spinner } from '@sk-web-gui/react';
import { FileText, Plus } from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

// careM's documentKind for a stored file, e.g. an inkommen handling — the only kind Lifecare hands over as a PDF yet.
const PDF_DOCUMENT_KIND = 'Pdf';

/** A Lifecare document chosen to go with the beslut. */
export interface LifecareDocumentChoice {
  id: string;
  title: string;
}

/**
 * The sökandes stored PDFs in Lifecare (inkomna handlingar and the like), to add to "Skicka beräkning och beslut".
 * Textdokument and blanketter are left out: caremanagement cannot print them as PDF yet. Read when the picker opens.
 */
export const LifecareDocumentPicker: FC<{
  errandId: string;
  /** The documents already chosen, which are not offered again. */
  chosenIds: string[];
  onPick: (document: LifecareDocumentChoice) => void;
}> = ({ errandId, chosenIds, onPick }) => {
  const { t } = useTranslation('errand');
  const { records, isLoading, error } = useLifecareDocuments(errandId);
  const pdfDocuments = records.documents.filter(
    (document) => document.documentKind === PDF_DOCUMENT_KIND && !chosenIds.includes(document.id)
  );

  if (isLoading) {
    return <Spinner size={2} aria-label={t('decideAndPay.attachments.lifecareLoading')} />;
  }
  if (error) {
    return <p className="m-0 text-small text-error-surface-primary">{t('decideAndPay.attachments.lifecareError')}</p>;
  }
  if (pdfDocuments.length === 0) {
    return <p className="m-0 text-small text-dark-secondary">{t('decideAndPay.attachments.lifecareNone')}</p>;
  }

  return (
    <ul
      className="m-0 p-0 list-none flex flex-col gap-4 max-h-[24rem] overflow-y-auto"
      aria-label={t('decideAndPay.attachments.lifecarePdfs')}
    >
      {pdfDocuments.map((document) => (
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
