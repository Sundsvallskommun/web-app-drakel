'use client';

import { Button } from '@sk-web-gui/react';
import { Download } from 'lucide-react';
import { FC } from 'react';

import { AttachmentFileIcon } from './attachment-file-icon.component';
import { RecordActionsMenu } from './record-actions-menu.component';

interface AttachmentFileRowProps {
  fileName: string;
  /** Shown in parentheses after the file name, e.g. "ansökan". */
  category?: string;
  /** Secondary line under the name (e.g. upload time and size). */
  description?: string;
  /** Image bytes for a thumbnail; the generic file icon is shown otherwise. */
  thumbnail?: File;
  /** Shows the "Visa" button; only set for files the preview modal can render. */
  canPreview: boolean;
  isDownloading: boolean;
  onPreview: () => void;
  onDownload: () => void;
}

/** One attachment in a file list: icon tile, bold name + category, secondary line, "Visa" and a "…" menu. */
export const AttachmentFileRow: FC<AttachmentFileRowProps> = ({
  fileName,
  category,
  description,
  thumbnail,
  canPreview,
  isDownloading,
  onPreview,
  onDownload,
}) => (
  <div className="flex items-center gap-16 rounded-button p-12">
    <AttachmentFileIcon thumbnail={thumbnail} />
    <div className="flex min-w-0 flex-1 flex-col gap-2 text-dark-secondary">
      <p className="m-0 flex min-w-0 gap-4">
        <span className="truncate font-bold" title={fileName}>
          {fileName}
        </span>
        {category ?
          <span className="shrink-0">({category})</span>
        : null}
      </p>
      {description ?
        <span className="text-small">{description}</span>
      : null}
    </div>
    {canPreview ?
      <Button size="sm" variant="tertiary" className="shrink-0" aria-label={`Visa ${fileName}`} onClick={onPreview}>
        Visa
      </Button>
    : null}
    <RecordActionsMenu
      recordLabel={fileName}
      loading={isDownloading}
      actions={[{ label: 'Ladda ner', icon: <Download />, onClick: onDownload }]}
    />
  </div>
);
