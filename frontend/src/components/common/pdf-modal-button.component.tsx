'use client';

import { useObjectUrl } from '@hooks/use-object-url';
import { ServiceResponse } from '@interfaces/services';
import { Button, Modal, Spinner } from '@sk-web-gui/react';
import { base64PdfToBlob, pdfObjectUrl } from '@utils/pdf-object-url';
import { ScanEye } from 'lucide-react';
import { FC, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PdfFrame } from './pdf-preview.component';

interface PdfModalButtonProps {
  /**
   * Fetches the PDF to show when the button is clicked — its bytes, or base64 as the print and render
   * endpoints answer. An error's `message` is shown in its place.
   */
  loadPdf: () => Promise<ServiceResponse<Blob | string>>;
  label?: string;
  modalLabel: string;
  disabled?: boolean;
  /** `preview` (default) — the "Förhandsgranska" look; `secondary` — a plain secondary button, e.g. "Visa pdf". */
  appearance?: 'preview' | 'secondary';
}

const toPdfBlob = (pdf: Blob | string): Blob => (typeof pdf === 'string' ? base64PdfToBlob(pdf) : pdf);

/**
 * A button that fetches a PDF on click and shows it in a modal (PdfFrame). Nothing is fetched until it is clicked,
 * and nothing is saved. Used for the saved attachments ("Visa pdf"), the beräkning — Drakel's own rendering or
 * Lifecare's print — and Lifecare's print of the beslut. The object URL is revoked when the modal closes, before
 * the next one and on unmount.
 */
export const PdfModalButton: FC<PdfModalButtonProps> = ({
  loadPdf,
  label,
  modalLabel,
  disabled = false,
  appearance = 'preview',
}) => {
  const { t } = useTranslation('attachments');
  const { objectUrl, setObjectUrl, revokeObjectUrl } = useObjectUrl();
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();
  // Bumped per click and on close, so a PDF that arrives after the modal was closed (or opened again) is dropped.
  const requestRef = useRef<number>(0);

  const close = (): void => {
    requestRef.current += 1;
    setOpen(false);
    setLoading(false);
    revokeObjectUrl();
  };

  const show = async (): Promise<void> => {
    const request = requestRef.current + 1;
    requestRef.current = request;
    revokeObjectUrl();
    setError(undefined);
    setLoading(true);
    setOpen(true);
    const result = await loadPdf();
    if (request !== requestRef.current) {
      return;
    }
    setLoading(false);
    if (result.error || !result.data) {
      setError(result.message ?? t('pdfPreviewButton.createError'));
      return;
    }
    setObjectUrl(pdfObjectUrl(toPdfBlob(result.data)));
  };

  const buttonLabel = label ?? t('pdfPreviewButton.label');

  return (
    <>
      {appearance === 'secondary' ?
        <Button variant="secondary" disabled={disabled} onClick={() => void show()}>
          {buttonLabel}
        </Button>
      : <Button
          color="vattjom"
          inverted
          leftIcon={<ScanEye />}
          disabled={disabled || loading}
          loading={loading}
          loadingText={t('pdfPreviewButton.creating')}
          onClick={() => void show()}
        >
          {buttonLabel}
        </Button>
      }

      <Modal show={open} onClose={close} label={modalLabel} className="w-[80rem] max-w-full">
        <Modal.Content>
          {error ?
            <p className="text-error-surface-primary m-0">{error}</p>
          : objectUrl ?
            <PdfFrame url={objectUrl} title={modalLabel} heightClassName="h-[80rem]" />
          : <div className="flex justify-center items-center h-[40rem]">
              <Spinner size={4} />
            </div>
          }
        </Modal.Content>
      </Modal>
    </>
  );
};
