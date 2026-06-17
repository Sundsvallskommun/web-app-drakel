'use client';

import { getAttachmentBlob } from '@services/errand-service/errand-service';
import { Disclosure } from '@sk-web-gui/react';
import { FileText } from 'lucide-react';
import { FC, useEffect, useState } from 'react';

interface PdfPreviewProps {
  errandId: string;
  attachmentId: string;
  title: string;
}

/**
 * Förhandsgranskar en PDF-bilaga inline i en iframe (samma mönster som beslutsförhandsgranskningen
 * i draken-public). Hämtar bilagan som blob och visar den via en object-URL.
 */
export const PdfPreview: FC<PdfPreviewProps> = ({ errandId, attachmentId, title }) => {
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

  return (
    <Disclosure variant="alt" initalOpen className="mb-16">
      <Disclosure.Header>
        <Disclosure.Icon icon={<FileText size={18} />} />
        <Disclosure.Title>{title}</Disclosure.Title>
        <Disclosure.Button />
      </Disclosure.Header>
      <Disclosure.Content>
        {isLoading ?
          <div className="flex justify-center items-center h-[60rem] text-dark-secondary">
            Laddar förhandsgranskning...
          </div>
        : error ?
          <div className="flex justify-center items-center h-[20rem] text-error">
            Kunde inte visa förhandsgranskningen
          </div>
        : <iframe src={`${url}#pagemode=none`} className="w-full h-[80rem] border-0" title={title} />}
      </Disclosure.Content>
    </Disclosure>
  );
};
