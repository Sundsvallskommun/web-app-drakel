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

/** Mime types we can render inline (PDF in an iframe, images fitted, .docx rendered client-side). */
export const isPreviewableMimeType = (mimeType: string): boolean =>
  isPdfMimeType(mimeType) || isImageMimeType(mimeType) || isDocxMimeType(mimeType);

/** Mime types we can render inline in the preview modal (PDF in an iframe, images fitted, .docx rendered). */
export const isPreviewableAttachment = (attachment: Attachment): boolean =>
  isPreviewableMimeType(attachment.mimeType ?? '');

/**
 * Renders a single file's bytes inline: PDFs and images render from a blob object URL (iframe / fitted
 * image), .docx is rendered to HTML in-browser by docx-preview. The blob is supplied by the parent —
 * fetched from the server (AttachmentPreviewModal) or a locally-selected File (LocalFilePreviewModal).
 */
const FilePreview: FC<{ blob?: Blob; mimeType: string; fileName: string; isLoading: boolean; error: boolean }> = ({
  blob,
  mimeType,
  fileName,
  isLoading,
  error,
}) => {
  const [url, setUrl] = useState<string>('');
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const isImage = isImageMimeType(mimeType);
  const isDocx = isDocxMimeType(mimeType);

  useEffect(() => {
    setUrl('');
    if (docxContainerRef.current) {
      docxContainerRef.current.innerHTML = '';
    }
    if (!blob) {
      return;
    }
    let objectUrl = '';
    if (isDocx) {
      // Render the .docx into the (already-mounted) container; no object URL needed.
      const container = docxContainerRef.current;
      if (container) {
        container.innerHTML = '';
        void renderAsync(blob, container);
      }
    } else {
      objectUrl = window.URL.createObjectURL(blob);
      setUrl(objectUrl);
    }
    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [blob, isDocx]);

  if (error) {
    return (
      <div className="flex justify-center items-center h-[20rem] text-error">Kunde inte visa förhandsgranskningen</div>
    );
  }
  if (isDocx) {
    // The container ref must stay mounted while loading so the render can target it.
    return (
      <div className="relative max-h-[80vh] overflow-auto bg-background-content p-16">
        {isLoading || !blob ?
          <div className="flex justify-center items-center h-[40rem] text-dark-secondary">
            <Spinner size={4} />
          </div>
        : null}
        <div ref={docxContainerRef} />
      </div>
    );
  }
  if (isLoading || !url) {
    return (
      <div className="flex justify-center items-center h-[40rem] text-dark-secondary">
        <Spinner size={4} />
      </div>
    );
  }
  if (isImage) {
    // Fit the image inside the modal (scales down large images, preserves aspect ratio).
    return (
      <div className="flex justify-center items-center max-h-[80vh] overflow-auto">
        {/* eslint-disable-next-line @next/next/no-img-element -- transient blob object URL; next/image
            can't optimize a one-off blob and adds no value over a plain fitted <img> here. */}
        <img src={url} alt={fileName} className="max-w-full max-h-[80vh] object-contain" />
      </div>
    );
  }
  return <iframe src={`${url}#pagemode=none`} className="w-full h-[80vh] border-0" title={fileName} />;
};

interface AttachmentPreviewModalProps {
  errandId: string;
  /** The attachment to preview; undefined keeps the modal closed. */
  attachment?: Attachment;
  onClose: () => void;
}

/**
 * Previews a single (already-uploaded) attachment inline in a modal by fetching its bytes. Conversation
 * files are routed through the message endpoint automatically (getUnifiedAttachmentBlob branches on
 * origin/messageId).
 */
export const AttachmentPreviewModal: FC<AttachmentPreviewModalProps> = ({ errandId, attachment, onClose }) => {
  const [blob, setBlob] = useState<Blob>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!attachment?.id) {
      return;
    }
    let active = true;
    setIsLoading(true);
    setError(false);
    setBlob(undefined);

    getUnifiedAttachmentBlob(errandId, attachment)
      .then((fetched) => {
        if (active) {
          setBlob(fetched);
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
    };
  }, [errandId, attachment?.id]);

  const title = attachment?.fileName ?? 'Förhandsgranskning';

  return (
    <Modal show={!!attachment} onClose={onClose} className="w-[84rem] max-w-full" label={title}>
      <FilePreview blob={blob} mimeType={attachment?.mimeType ?? ''} fileName={title} isLoading={isLoading} error={error} />
    </Modal>
  );
};

/**
 * Previews a locally-selected file (not yet uploaded) inline in a modal — used when composing a message,
 * so the handläggare can check an attachment before sending. The File's bytes are already in the browser,
 * so no fetch is needed.
 */
export const LocalFilePreviewModal: FC<{ file?: File; onClose: () => void }> = ({ file, onClose }) => {
  const title = file?.name ?? 'Förhandsgranskning';
  return (
    <Modal show={!!file} onClose={onClose} className="w-[84rem] max-w-full" label={title}>
      <FilePreview blob={file} mimeType={file?.type ?? ''} fileName={title} isLoading={false} error={false} />
    </Modal>
  );
};
