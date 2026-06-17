'use client';

import { Attachment } from '@data-contracts/backend/data-contracts';
import { useAttachmentImagePreviews } from '@hooks/use-attachment-previews';
import { downloadUnifiedAttachment } from '@services/errand-service/errand-service';
import { Button, FileUpload, UploadFile } from '@sk-web-gui/react';
import { formatFileSize } from '@utils/format-file-size';
import dayjs from 'dayjs';
import { Download } from 'lucide-react';
import { FC, useState } from 'react';

/**
 * Maps a caremanagement attachment onto sk-web-gui's UploadFile shape. Images get the real fetched File
 * (with bytes) so FileUpload renders a thumbnail; everything else gets a 0-byte placeholder carrying
 * only the name/type — enough for the document icon.
 */
const toUploadFile = (attachment: Attachment, imageFile?: File): UploadFile => {
  const fileName = attachment.fileName ?? 'bilaga';
  const dotIndex = fileName.lastIndexOf('.');
  const name = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  const ending = dotIndex > 0 ? fileName.slice(dotIndex + 1) : '';
  return {
    id: attachment.id ?? '',
    file: imageFile ?? new File([], fileName, { type: attachment.mimeType }),
    meta: { name, ending, created: attachment.created, size: attachment.fileSize },
  };
};

interface AttachmentListProps {
  errandId: string;
  attachments: Attachment[];
  placeholder?: string;
}

/**
 * Read-only list of errand attachments with image thumbnails and a per-file download button. Downloads
 * route conversation files through the message endpoint automatically (handled in the service via the
 * attachment's origin/messageId). Reused by the Bilagor tab and the "Bilagor från meddelanden" tab.
 */
export const AttachmentList: FC<AttachmentListProps> = ({ errandId, attachments, placeholder = 'Inga bilagor' }) => {
  const imagePreviews = useAttachmentImagePreviews(errandId, attachments);
  const [downloadingId, setDownloadingId] = useState<string>();
  const [error, setError] = useState<string>();

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
    <div className="flex flex-col gap-12">
      {error && <p className="text-error-surface-primary m-0">{error}</p>}
      <FileUpload.List placeholder={placeholder}>
        {attachments.map((attachment, index) => (
          <FileUpload.ListItem
            key={attachment.id ?? index}
            index={index}
            file={toUploadFile(attachment, attachment.id ? imagePreviews[attachment.id] : undefined)}
            nameProps={{
              description: `${
                attachment.created ? dayjs(attachment.created).format('YYYY-MM-DD HH:mm') : '—'
              } · ${formatFileSize(attachment.fileSize)}`,
            }}
            actionsProps={{
              extraActions: (
                <Button
                  size="sm"
                  variant="tertiary"
                  iconButton
                  aria-label={`Ladda ner ${attachment.fileName ?? 'bilaga'}`}
                  loading={downloadingId === attachment.id}
                  onClick={() => void download(attachment)}
                  leftIcon={<Download />}
                />
              ),
            }}
          />
        ))}
      </FileUpload.List>
    </div>
  );
};
