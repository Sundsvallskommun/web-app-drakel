'use client';

import { Button } from '@sk-web-gui/react';
import { Download } from 'lucide-react';
import { FC } from 'react';

interface MessageAttachmentChipProps {
  fileName: string;
  /** Shows the "Visa" button; only set for files the preview modal can render. */
  canPreview: boolean;
  isDownloading: boolean;
  downloadDisabled?: boolean;
  onPreview: () => void;
  onDownload: () => void;
}

/** A file shared in a conversation message: outlined row with the file name, "Visa" and a download button. */
export const MessageAttachmentChip: FC<MessageAttachmentChipProps> = ({
  fileName,
  canPreview,
  isDownloading,
  downloadDisabled = false,
  onPreview,
  onDownload,
}) => (
  <div className="flex min-w-0 w-full sm:w-[275px] max-w-full items-center gap-12 rounded-8 border-1 border-divider px-12 py-8">
    <span className="min-w-0 flex-1 truncate text-dark-secondary" title={fileName}>
      {fileName}
    </span>
    {canPreview ?
      <Button size="sm" variant="tertiary" className="shrink-0" aria-label={`Visa ${fileName}`} onClick={onPreview}>
        Visa
      </Button>
    : null}
    <Button
      size="sm"
      variant="tertiary"
      iconButton
      className="shrink-0 bg-transparent"
      aria-label={`Ladda ner ${fileName}`}
      loading={isDownloading}
      disabled={downloadDisabled}
      leftIcon={<Download />}
      onClick={onDownload}
    />
  </div>
);
