'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { PdfPreview } from '@components/common/pdf-preview.component';
import { Attachment } from '@data-contracts/backend/data-contracts';
import { SUMMARY_PDF } from '@utils/attachment-names';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { AttachmentList } from './attachment-list.component';
import { AttachmentUploadField } from './attachment-upload-field.component';
import { ErrandSectionHeader } from './errand-section-header.component';

interface ErrandAttachmentsProps {
  errandId: string;
  /** The errand-level attachments (application / generated / errand files; conversation files excluded). */
  attachments: Attachment[];
  /**
   * Conversation files; when passed they are listed as a second "Bilagor från meddelanden" group
   * (they also have their own Meddelanden → Bilagor tab).
   */
  messageAttachments?: Attachment[];
  isLoading: boolean;
  loadError: boolean;
  /** Re-fetches the attachment list; called after an upload so the new file shows up. */
  refresh: () => void;
  /** Heading of the errand attachment group. */
  heading?: string;
}

/** The Ärende → Bilagor tab: heading, upload field, the application summary PDF and the attachment groups. */
export const ErrandAttachments: FC<ErrandAttachmentsProps> = ({
  errandId,
  attachments,
  messageAttachments,
  isLoading,
  loadError,
  refresh,
  heading,
}) => {
  const { t } = useTranslation('attachments');
  const summaryAttachment = attachments.find((attachment) => (attachment.fileName ?? '').toLowerCase() === SUMMARY_PDF);

  return (
    <div className="flex flex-col gap-40">
      <ErrandSectionHeader title={t('title')} description={t('errandAttachments.description')} />

      <AttachmentUploadField errandId={errandId} onUploaded={refresh} />

      {summaryAttachment?.id ?
        <PdfPreview
          errandId={errandId}
          attachmentId={summaryAttachment.id}
          title={t('errandAttachments.summaryTitle')}
        />
      : null}

      <AsyncContent isLoading={isLoading} error={loadError} errorText={t('loadError')}>
        <AttachmentList errandId={errandId} attachments={attachments} heading={heading ?? t('title')} />
        {messageAttachments ?
          <AttachmentList
            errandId={errandId}
            attachments={messageAttachments}
            heading={t('messageAttachments.heading')}
            placeholder={t('messageAttachments.empty')}
          />
        : null}
      </AsyncContent>
    </div>
  );
};
