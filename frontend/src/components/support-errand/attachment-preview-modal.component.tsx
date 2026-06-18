'use client';

import { Attachment } from '@data-contracts/backend/data-contracts';
import { getUnifiedAttachmentBlob } from '@services/errand-service/errand-service';
import { Modal, Spinner } from '@sk-web-gui/react';
import { renderAsync } from 'docx-preview';
import { FC, useEffect, useRef, useState } from 'react';

const isImageMimeType = (mimeType: string): boolean => mimeType.startsWith('image/');
const isPdfMimeType = (mimeType: string): boolean => mimeType === 'application/pdf';
// Only the modern .docx (Office Open XML) can be rendered client-side; legacy binary .doc cannot.
const isDocxMimeType = (mimeType: string): boolean =>
  mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/** Mime types we can render inline in the preview modal (PDF in an iframe, images fitted, .docx rendered). */
export const isPreviewableAttachment = (attachment: Attachment): boolean => {
  const mimeType = attachment.mimeType ?? '';
  return isPdfMimeType(mimeType) || isImageMimeType(mimeType) || isDocxMimeType(mimeType);
};

interface AttachmentPreviewModalProps {
  errandId: string;
  /** The attachment to preview; undefined keeps the modal closed. */
  attachment?: Attachment;
  onClose: () => void;
}

/**
 * Previews a single attachment inline in a modal: PDFs and images render from a blob object URL
 * (iframe / fitted image), .docx is rendered to HTML in-browser by docx-preview. Conversation files are
 * routed through the message endpoint automatically (getUnifiedAttachmentBlob branches on origin/messageId).
 */
export const AttachmentPreviewModal: FC<AttachmentPreviewModalProps> = ({ errandId, attachment, onClose }) => {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const mimeType = attachment?.mimeType ?? '';
  const isImage = isImageMimeType(mimeType);
  const isDocx = isDocxMimeType(mimeType);

  useEffect(() => {
    if (!attachment?.id) {
      return;
    }
    let active = true;
    let objectUrl = '';
    setIsLoading(true);
    setError(false);
    setUrl('');
    if (docxContainerRef.current) {
      docxContainerRef.current.innerHTML = '';
    }

    getUnifiedAttachmentBlob(errandId, attachment)
      .then(async (blob) => {
        if (!active) {
          return;
        }
        if (isDocx) {
          // Render the .docx into the (already-mounted) container; no object URL needed.
          const container = docxContainerRef.current;
          if (container) {
            container.innerHTML = '';
            await renderAsync(blob, container);
          }
        } else {
          objectUrl = window.URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
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
  }, [errandId, attachment?.id, isDocx]);

  const title = attachment?.fileName ?? 'Förhandsgranskning';

  return (
    <Modal show={!!attachment} onClose={onClose} className="w-[84rem] max-w-full" label={title}>
      {error ?
        <div className="flex justify-center items-center h-[20rem] text-error">
          Kunde inte visa förhandsgranskningen
        </div>
      : isDocx ?
        // The container ref must stay mounted while loading so the fetch can render into it.
        <div className="relative max-h-[80vh] overflow-auto bg-background-content p-16">
          {isLoading ?
            <div className="flex justify-center items-center h-[40rem] text-dark-secondary">
              <Spinner size={4} />
            </div>
          : null}
          <div ref={docxContainerRef} />
        </div>
      : isLoading ?
        <div className="flex justify-center items-center h-[40rem] text-dark-secondary">
          <Spinner size={4} />
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
