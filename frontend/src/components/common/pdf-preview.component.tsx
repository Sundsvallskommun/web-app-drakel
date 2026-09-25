'use client';

import { getAttachmentBlob } from '@services/errand-service/errand-service';
import { Button, Disclosure } from '@sk-web-gui/react';
import { ExternalLink, FileText } from 'lucide-react';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * A PDF shown trimmed down — no side panel and none of the reader's own toolbar, fitted to the frame's width — with
 * "Öppna bilaga i ny flik" above it. `url` is an object URL the caller holds (and revokes).
 */
export const PdfFrame: FC<{ url: string; title: string; heightClassName?: string }> = ({
  url,
  title,
  heightClassName = 'h-[95rem]',
}) => {
  const { t } = useTranslation('attachments');
  // PDF open parameters rather than a rendering library: `view=FitH` makes the built-in reader fit the
  // page to the frame's width instead of picking its own zoom (which opens uncomfortably close), and
  // pagemode/toolbar drop the sidebar and the reader's own chrome so the page itself fills the frame.
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="tertiary"
          leftIcon={<ExternalLink />}
          onClick={() => {
            // The object URL is same-origin, so a new tab can read it while this view still holds it.
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
        >
          {t('preview.openInNewTab')}
        </Button>
      </div>
      <iframe
        src={`${url}#pagemode=none&toolbar=0&navpanes=0&view=FitH`}
        className={`w-full ${heightClassName} border-0`}
        title={title}
      />
    </div>
  );
};

interface PdfPreviewProps {
  errandId: string;
  attachmentId: string;
  title: string;
}

/**
 * Förhandsgranskar en PDF-bilaga inline i en iframe (samma mönster som beslutsförhandsgranskningen
 * i draken-public). Hämtar bilagan som blob och visar den via en object-URL. Utan disclosure-omslag.
 *
 * Knappen "Öppna bilaga i ny flik" sitter här snarare än i disclosure-huvudet: object-URL:en lever i
 * den här komponenten, och huvudet är redan en klickyta för att fälla ihop — en knapp inuti den blir
 * en knapp i en knapp. Den följer därmed med både i disclosure-varianten och i modalen.
 */
export const PdfPreviewFrame: FC<PdfPreviewProps> = ({ errandId, attachmentId, title }) => {
  const { t } = useTranslation('attachments');
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setIsLoading(true);
    setError(false);

    getAttachmentBlob(errandId, attachmentId)
      .then((blob) => {
        if (!active) return;
        objectUrl = window.URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [errandId, attachmentId]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-[60rem] text-dark-secondary">{t('preview.loading')}</div>;
  }
  if (error) {
    return <div className="flex justify-center items-center h-[20rem] text-error">{t('preview.error')}</div>;
  }
  return <PdfFrame url={url} title={title} />;
};

/**
 * PDF-förhandsgranskning i ett hopfällbart disclosure-omslag (för bilagelistor).
 *
 * Innehållets egen padding nollställs så att PDF:en fyller hela bredden på behållaren den ligger i —
 * en inramad A4-sida med luft runt om blir onödigt smal att läsa.
 */
export const PdfPreview: FC<PdfPreviewProps> = ({ errandId, attachmentId, title }) => (
  <Disclosure variant="alt" initalOpen>
    <Disclosure.Header>
      <Disclosure.Icon icon={<FileText size={18} />} />
      <Disclosure.Title>{title}</Disclosure.Title>
      <Disclosure.Button />
    </Disclosure.Header>
    <Disclosure.Content className="p-0">
      <PdfPreviewFrame errandId={errandId} attachmentId={attachmentId} title={title} />
    </Disclosure.Content>
  </Disclosure>
);
