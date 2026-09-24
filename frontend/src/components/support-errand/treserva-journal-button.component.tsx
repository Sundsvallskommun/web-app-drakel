'use client';

import { getTreservaJournal } from '@services/treserva-journal-service';
import { Button } from '@sk-web-gui/react';
import { base64PdfToObjectUrl } from '@utils/pdf-object-url';
import { FileText } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * "Journal från Treserva" — opens the applicant's journal migrated from Treserva as a PDF in a new tab. It sits
 * first on the Journal tab, above the journalanteckningar, since it is the history everything else follows.
 *
 * TODO(treserva-journal): the BFF serves a MOCK test PDF until the migrated journal is in Lifecare. When it is,
 * the BFF finds it by its fixed name among the person's journalanteckningar; this button stays as it is, but
 * should say so when a person has no migrated journal (the BFF will answer 404).
 */
export const TreservaJournalButton: FC<{ errandId: string }> = ({ errandId }) => {
  const { t } = useTranslation('documentation');
  const [opening, setOpening] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  const open = async (): Promise<void> => {
    setError(undefined);
    // The tab is opened while the click is still being handled — a tab opened after the PDF has loaded would
    // be taken for a pop-up and blocked — and pointed at the PDF once it is there.
    const tab = window.open('', '_blank');
    setOpening(true);
    const result = await getTreservaJournal(errandId);
    setOpening(false);
    if (result.error || !result.data) {
      tab?.close();
      setError(result.message ?? t('treserva.error'));
      return;
    }
    const url = base64PdfToObjectUrl(result.data);
    if (tab) {
      tab.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-12">
      <Button variant="secondary" size="sm" leftIcon={<FileText />} loading={opening} onClick={() => void open()}>
        {t('treserva.button')}
      </Button>
      <span className="text-small text-dark-secondary">{t('treserva.description')}</span>
      {error ?
        <span className="text-small text-error-surface-primary">{error}</span>
      : null}
    </div>
  );
};
