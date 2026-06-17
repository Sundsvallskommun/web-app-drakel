'use client';

import { Attachment } from '@data-contracts/backend/data-contracts';
import { getUnifiedAttachmentBlob } from '@services/errand-service/errand-service';
import { Modal, Spinner } from '@sk-web-gui/react';
import { FC, useEffect, useState } from 'react';

const isImageMimeType = (mimeType: string): boolean => mimeType.startsWith('image/');
const isPdfMimeType = (mimeType: string): boolean => mimeType === 'application/pdf';

/** Mime types we can render inline in the preview modal (PDFs in an iframe, images as a fitted image). */
export const isPreviewableAttachment = (attachment: Attachment): boolean => {
  const mimeType = attachment.mimeType ?? '';
  return isPdfMimeType(mimeType) || isImageMimeType(mimeType);
};

interface AttachmentPreviewModalProps {
  errandId: string;
  /** The attachment to preview; undefined keeps the modal closed. */
  attachment?: Attachment;
  onClose: () => void;
}

/**
 * Previews a single attachment inline in a modal. PDFs and images render in an iframe fed by a blob
 * object URL — conversation files are routed through the message endpoint automatically (the service's
 * getUnifiedAttachmentBlob branches on the attachment's origin/messageId).
 */
export const AttachmentPreviewModal: FC<AttachmentPreviewModalProps> = ({ errandId, attachment, onClose }) => {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!attachment?.id) {
      return;
    }
    let active = true;
    let objectUrl = '';
    setIsLoading(true);
    setError(false);
    setUrl('');

    getUnifiedAttachmentBlob(errandId, attachment)
      .then((blob) => {
        if (!active) {
          return;
        }
        objectUrl = window.URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) {
          setError(true);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [errandId, attachment?.id]);

  const title = attachment?.fileName ?? 'Förhandsgranskning';
  const isImage = isImageMimeType(attachment?.mimeType ?? '');

  return (
    <Modal show={!!attachment} onClose={onClose} className="w-[84rem] max-w-full" label={title}>
      {isLoading ?
        <div className="flex justify-center items-center h-[40rem] text-dark-secondary">
          <Spinner size={4} />
        </div>
      : error ?
        <div className="flex justify-center items-center h-[20rem] text-error">
          Kunde inte visa förhandsgranskningen
        </div>
      : !url ?
        null
      : isImage ?
        // Fit the image inside the modal (scales down large images, preserves aspect ratio).
        <div className="flex justify-center items-center max-h-[80vh] overflow-auto">
          {/* eslint-disable-next-line @next/next/no-img-element -- transient blob object URL; next/image
              can't optimize a one-off blob and adds no value over a plain fitted <img> here. */}
          <img src={url} alt={title} className="max-w-full max-h-[80vh] object-contain" />
        </div>
      : <iframe src={`${url}#pagemode=none`} className="w-full h-[80vh] border-0" title={title} />}
    </Modal>
  );
};
