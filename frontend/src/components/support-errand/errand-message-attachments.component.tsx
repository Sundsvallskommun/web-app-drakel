'use client';

import { PdfPreview } from '@components/common/pdf-preview.component';
import { Attachment } from '@data-contracts/backend/data-contracts';
import { Spinner } from '@sk-web-gui/react';
import { FC } from 'react';

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
  return (
    <div className="flex flex-col gap-40">
      {hideHeading ? null : (
        <ErrandSectionHeader title="Bilagor" description="Här samlas filer som har skickats i ärendets meddelanden." />
      )}

      {summaryAttachment?.id ?
        <PdfPreview
          errandId={errandId}
          attachmentId={summaryAttachment.id}
          title="Sammanställning bilagor från meddelanden"
        />
      : null}

      {isLoading ?
        <Spinner size={3} />
      : loadError ?
        <p className="m-0">Det gick inte att hämta bilagor</p>
      : <AttachmentList
          errandId={errandId}
          attachments={attachments}
          heading="Bilagor från meddelanden"
          placeholder="Inga bilagor i meddelanden"
        />
      }
    </div>
  );
};
