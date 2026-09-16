'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { PdfPreview } from '@components/common/pdf-preview.component';
import { Attachment } from '@data-contracts/backend/data-contracts';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { AttachmentList } from './attachment-list.component';
import { ErrandSectionHeader } from './errand-section-header.component';

interface ErrandMessageAttachmentsProps {
  errandId: string;
  /** The conversation attachments (documentType CONVERSATION) shared in the errand's messages. */
  attachments: Attachment[];
  /** The consolidated client conversation files PDF (klientbilagor.pdf), previewed at the top when present. */
  summaryAttachment?: Attachment;
  isLoading: boolean;
  loadError: boolean;
  /** Hide the tab heading and description (e.g. when shown inside a titled disclosure). */
  hideHeading?: boolean;
}

/**
 * Lists every file shared in the errand's conversation (documentType CONVERSATION) in one place — separate
 * from the Bilagor tab, which shows application/generated/errand files. A consolidated PDF of all
 * client conversation files (klientbilagor.pdf) is previewed at the top, mirroring the Bilagor tab's
 * sammanstallning.pdf. Downloads route through the message endpoint automatically (AttachmentList).
 */
export const ErrandMessageAttachments: FC<ErrandMessageAttachmentsProps> = ({
  errandId,
  attachments,
  summaryAttachment,
  isLoading,
  loadError,
  hideHeading = false,
}) => {
  const { t } = useTranslation('attachments');
  return (
    <div className="flex flex-col gap-40">
      {hideHeading ? null : (
        <ErrandSectionHeader title={t('title')} description={t('messageAttachments.description')} />
      )}

      {summaryAttachment?.id ?
        <PdfPreview
          errandId={errandId}
          attachmentId={summaryAttachment.id}
          title={t('messageAttachments.summaryTitle')}
        />
      : null}

      <AsyncContent isLoading={isLoading} error={loadError} errorText={t('loadError')}>
        <AttachmentList
          errandId={errandId}
          attachments={attachments}
          heading={t('messageAttachments.heading')}
          placeholder={t('messageAttachments.empty')}
        />
      </AsyncContent>
    </div>
  );
};
