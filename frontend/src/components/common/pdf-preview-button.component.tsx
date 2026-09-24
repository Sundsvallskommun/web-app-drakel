'use client';

import { ServiceResponse } from '@interfaces/services';
import { Button, Modal, Spinner } from '@sk-web-gui/react';
import { base64PdfToObjectUrl } from '@utils/pdf-object-url';
import { ScanEye } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * "Förhandsgranska PDF"-knapp: hämtar en PDF (via `loadPdf`) och visar den i en modal. Inget sparas.
 * Beräkningen renderar sin egen HTML till PDF; beslutet är Lifecares egen utskrift.
 */
export const PdfPreviewButton: FC<{
  /** Fetches the PDF to show, as base64; an error's `message` is shown in its place. */
  loadPdf: () => Promise<ServiceResponse<string>>;
  label?: string;
  modalLabel?: string;
  disabled?: boolean;
}> = ({ loadPdf, label, modalLabel, disabled = false }) => {
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
    const res = await loadPdf();
    setLoading(false);
    if (res.error || !res.data) {
      setError(res.message ?? t('pdfPreviewButton.createError'));
      setOpen(true);
      return;
    }
    setUrl(base64PdfToObjectUrl(res.data));
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
