'use client';

import { renderPdf } from '@services/pdf-service';
import { Button, Modal, Spinner } from '@sk-web-gui/react';
import { ScanEye } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
}> = ({ buildHtml, label, modalLabel, emptyMessage, disabled = false }) => {
  const { t } = useTranslation('attachments');
  const buttonLabel = label ?? t('pdfPreviewButton.label');
  const modalTitle = modalLabel ?? t('common:preview');
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
      setError(emptyMessage ?? t('pdfPreviewButton.empty'));
      setOpen(true);
      return;
    }
    const res = await renderPdf(html);
    setLoading(false);
    if (res.error || !res.data) {
      setError(t('pdfPreviewButton.createError'));
      setOpen(true);
      return;
    }
    setUrl(base64ToObjectUrl(res.data));
    setOpen(true);
  };

  return (
    <>
      <Button
        color="vattjom"
        inverted
        leftIcon={<ScanEye />}
        disabled={disabled || loading}
        loading={loading}
        loadingText={t('pdfPreviewButton.creating')}
        onClick={() => void preview()}
      >
        {buttonLabel}
      </Button>

      <Modal show={open} onClose={close} label={modalTitle} className="w-[80rem] max-w-full">
        <Modal.Content>
          {error ?
            <p className="text-error-surface-primary m-0">{error}</p>
          : url ?
            <iframe src={`${url}#pagemode=none`} className="w-full h-[80rem] border-0" title={modalTitle} />
          : <div className="flex justify-center items-center h-[40rem]">
              <Spinner size={4} />
            </div>
          }
        </Modal.Content>
      </Modal>
    </>
  );
};
