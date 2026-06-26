'use client';

import { Button, Modal } from '@sk-web-gui/react';
import { FC, useState } from 'react';

import { PdfPreviewFrame } from './pdf-preview.component';

/**
 * "Visa pdf"-knapp som öppnar en befintlig PDF-bilaga i en modal (i stället för inline). Frame:n monteras
 * bara när modalen är öppen, så bilagan hämtas först vid klick.
 */
export const AttachmentPdfButton: FC<{
  errandId: string;
  attachmentId: string;
  label?: string;
  modalLabel?: string;
}> = ({ errandId, attachmentId, label = 'Visa pdf', modalLabel = 'Förhandsgranska PDF' }) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setOpen(true);
        }}
      >
        {label}
      </Button>

      <Modal
        show={open}
        onClose={() => {
          setOpen(false);
        }}
        label={modalLabel}
        className="w-[80rem] max-w-full"
      >
        <Modal.Content>
          {open ? <PdfPreviewFrame errandId={errandId} attachmentId={attachmentId} title={modalLabel} /> : null}
        </Modal.Content>
      </Modal>
    </>
  );
};
