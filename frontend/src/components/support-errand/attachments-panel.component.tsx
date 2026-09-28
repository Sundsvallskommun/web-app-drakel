'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { PdfPreview } from '@components/common/pdf-preview.component';
import { Attachment } from '@data-contracts/backend/data-contracts';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { AttachmentList } from './attachment-list.component';
import { ErrandSectionHeader } from './errand-section-header.component';

interface AttachmentsPanelProps {
  errandId: string;
  attachments: Attachment[];
  /** The tab's heading and description; left out when the panel already sits under a heading of its own. */
  header?: { title: string; description: string };
  /** A consolidated PDF previewed above the list (sammanstallning.pdf or klientbilagor.pdf), when there is one. */
  summary?: { attachment?: Attachment; title: string };
  /** Group heading above the file list. */
  listHeading: string;
  /** Shown instead of the list when there are no files. */
  placeholder?: string;
  isLoading: boolean;
  loadError: boolean;
}

/**
 * A read-only attachments tab: an optional heading, a consolidated PDF previewed at the top and the file list below.
 * Shared by Ärende → Bilagor (application / generated / errand files, with the application summary) and
 * Meddelanden → Bilagor (conversation files, with the client files PDF). Downloads and previews route
 * conversation files through the message endpoint automatically (AttachmentList).
 */
export const AttachmentsPanel: FC<AttachmentsPanelProps> = ({
  errandId,
  attachments,
  header,
  summary,
  listHeading,
  placeholder,
  isLoading,
  loadError,
}) => {
  const { t } = useTranslation('attachments');
  const summaryAttachmentId = summary?.attachment?.id;

  return (
    <div className="flex flex-col gap-40">
      {header ?
        <ErrandSectionHeader title={header.title} description={header.description} />
      : null}

      {summary && summaryAttachmentId ?
        <PdfPreview errandId={errandId} attachmentId={summaryAttachmentId} title={summary.title} />
      : null}

      <AsyncContent isLoading={isLoading} error={loadError} errorText={t('loadError')}>
        <AttachmentList errandId={errandId} attachments={attachments} heading={listHeading} placeholder={placeholder} />
      </AsyncContent>
    </div>
  );
};
