'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { PdfPreview } from '@components/common/pdf-preview.component';
import { Attachment } from '@data-contracts/backend/data-contracts';
import { SUMMARY_PDF } from '@utils/attachment-names';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { AttachmentList } from './attachment-list.component';
import { ErrandSectionHeader } from './errand-section-header.component';

interface ErrandAttachmentsProps {
  errandId: string;
  /** The errand-level attachments (application / generated / errand files; conversation files excluded). */
  attachments: Attachment[];
  /**
   * Conversation files. They are merged into the single list rather than shown as their own group — a
   * handläggare looking for a file should not have to know which way it arrived. They also keep their
   * own Meddelanden → Bilagor tab.
   */
  messageAttachments?: Attachment[];
  isLoading: boolean;
  loadError: boolean;
  /** Heading of the errand attachment group. */
  heading?: string;
}

/** The Ärende → Bilagor tab: heading, the application summary PDF and one merged attachment list (read-only). */
export const ErrandAttachments: FC<ErrandAttachmentsProps> = ({
  errandId,
  attachments,
  messageAttachments,
  isLoading,
  loadError,
  heading,
}) => {
  const { t } = useTranslation('attachments');
  const summaryAttachment = attachments.find((attachment) => (attachment.fileName ?? '').toLowerCase() === SUMMARY_PDF);

  return (
    <div className="flex flex-col gap-40">
      <ErrandSectionHeader title={t('title')} description={t('errandAttachments.description')} />

      {summaryAttachment?.id ?
        <PdfPreview
          errandId={errandId}
          attachmentId={summaryAttachment.id}
          title={t('errandAttachments.summaryTitle')}
        />
      : null}

      <AsyncContent isLoading={isLoading} error={loadError} errorText={t('loadError')}>
        <AttachmentList
          errandId={errandId}
          attachments={[...attachments, ...(messageAttachments ?? [])]}
          heading={heading ?? t('title')}
        />
      </AsyncContent>
    </div>
  );
};
