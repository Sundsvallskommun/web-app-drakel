'use client';

import { Attachment } from '@data-contracts/backend/data-contracts';
import { useAttachmentImagePreviews } from '@hooks/use-attachment-previews';
import { downloadUnifiedAttachment } from '@services/errand-service/errand-service';
import { attachmentCategoryLabel } from '@utils/attachment-category';
import { formatFileSize } from '@utils/format-file-size';
import dayjs from 'dayjs';
import { FC, useState } from 'react';

import { AttachmentFileRow } from './attachment-file-row.component';
import { AttachmentPreviewModal, isPreviewableAttachment } from './attachment-preview-modal.component';

/** "YYYY-MM-DD HH:mm · 1.2 MB" — the secondary line under an attachment's name. */
const attachmentDescription = (attachment: Attachment): string =>
  `${attachment.created ? dayjs(attachment.created).format('YYYY-MM-DD HH:mm') : '—'} · ${formatFileSize(
    attachment.fileSize
  )}`;

interface AttachmentListProps {
  errandId: string;
  attachments: Attachment[];
  /** Group heading above the list, e.g. "Bilagor från ansökan". */
  heading?: string;
  placeholder?: string;
}

/**
 * Read-only group of errand attachments: an optional heading and one row per file separated by dividers,
 * each with "Visa" (inline preview modal, for previewable types) and a "…" menu with download. Downloads
 * and previews route conversation files through the message endpoint automatically (handled in the service
 * via the attachment's documentType/messageId). Reused by the Bilagor tab and the "Bilagor från meddelanden" tab.
 */
export const AttachmentList: FC<AttachmentListProps> = ({
  errandId,
  attachments,
  heading,
  placeholder = 'Inga bilagor',
}) => {
  const imagePreviews = useAttachmentImagePreviews(errandId, attachments);
  const [downloadingId, setDownloadingId] = useState<string>();
  const [error, setError] = useState<string>();
  const [previewAttachment, setPreviewAttachment] = useState<Attachment>();

  const download = async (attachment: Attachment) => {
    if (!attachment.id) {
      return;
    }
    setDownloadingId(attachment.id);
    setError(undefined);
    try {
      await downloadUnifiedAttachment(errandId, attachment);
    } catch {
      setError('Det gick inte att hämta filen');
    } finally {
      setDownloadingId(undefined);
    }
  };

  return (
    <section className="flex flex-col gap-8">
      {heading ?
        <h3 className="m-0 text-base font-bold text-dark-primary">{heading}</h3>
      : null}
      {error ?
        <p className="m-0 text-error-surface-primary">{error}</p>
      : null}

      {attachments.length === 0 ?
        <p className="m-0 border-t-1 border-divider pt-12 text-dark-secondary">{placeholder}</p>
      : <ul className="m-0 flex list-none flex-col p-0">
          {attachments.map((attachment, index) => {
            const fileName = attachment.fileName ?? 'bilaga';
            return (
              <li key={attachment.id ?? index} className="border-t-1 border-divider">
                <AttachmentFileRow
                  fileName={fileName}
                  category={attachmentCategoryLabel(attachment)}
                  description={attachmentDescription(attachment)}
                  thumbnail={attachment.id ? imagePreviews[attachment.id] : undefined}
                  canPreview={isPreviewableAttachment(attachment)}
                  isDownloading={downloadingId === attachment.id}
                  onPreview={() => {
                    setPreviewAttachment(attachment);
                  }}
                  onDownload={() => void download(attachment)}
                />
              </li>
            );
          })}
        </ul>
      }

      <AttachmentPreviewModal
        errandId={errandId}
        attachment={previewAttachment}
        onClose={() => {
          setPreviewAttachment(undefined);
        }}
      />
    </section>
  );
};
