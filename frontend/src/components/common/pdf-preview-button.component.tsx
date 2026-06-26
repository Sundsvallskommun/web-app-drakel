'use client';

import { renderPdf } from '@services/pdf-service';
import { Button, Modal, Spinner } from '@sk-web-gui/react';
import { FC, useState } from 'react';

/** Converts a base64 PDF to an object URL so it can be shown in an <iframe>. */
const base64ToObjectUrl = (base64: string): string => {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  return window.URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
};

/**
 * "Förhandsgranska PDF"-knapp: bygger HTML (via `buildHtml`), renderar den till en PDF via BFF:n och
 * visar den i en modal. Inget sparas. Återanvänds av beslut och beräkning.
 */
export const PdfPreviewButton: FC<{
  /** Builds the HTML to render (undefined ⇒ nothing to preview). */
  buildHtml: () => Promise<string | undefined>;
  label?: string;
  modalLabel?: string;
  emptyMessage?: string;
  disabled?: boolean;
}> = ({
  buildHtml,
  label = 'Förhandsgranska PDF',
  modalLabel = 'Förhandsgranska',
  emptyMessage = 'Det finns inget att förhandsgranska.',
  disabled = false,
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [url, setUrl] = useState<string>('');
  const [error, setError] = useState<string>();

  const close = (): void => {
    setOpen(false);
    if (url) {
      window.URL.revokeObjectURL(url);
      setUrl('');
    }
  };

  const preview = async (): Promise<void> => {
    setLoading(true);
    setError(undefined);
    const html = await buildHtml();
    if (!html) {
      setLoading(false);
      setError(emptyMessage);
      setOpen(true);
      return;
    }
    const res = await renderPdf(html);
    setLoading(false);
    if (res.error || !res.data) {
      setError('Det gick inte att skapa förhandsgranskningen.');
      setOpen(true);
      return;
    }
    setUrl(base64ToObjectUrl(res.data));
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="secondary"
        disabled={disabled || loading}
        loading={loading}
        loadingText="Skapar förhandsgranskning…"
        onClick={() => void preview()}
      >
        {label}
      </Button>

      <Modal show={open} onClose={close} label={modalLabel} className="w-[80rem] max-w-full">
        <Modal.Content>
          {error ?
            <p className="text-error-surface-primary m-0">{error}</p>
          : url ?
            <iframe src={`${url}#pagemode=none`} className="w-full h-[80rem] border-0" title={modalLabel} />
          : <div className="flex justify-center items-center h-[40rem]">
              <Spinner size={4} />
            </div>
          }
        </Modal.Content>
      </Modal>
    </>
  );
};
