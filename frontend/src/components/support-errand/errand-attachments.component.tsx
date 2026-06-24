'use client';

import { PdfPreview } from '@components/common/pdf-preview.component';
import { Attachment } from '@data-contracts/backend/data-contracts';
import { Spinner } from '@sk-web-gui/react';
import { SUMMARY_PDF } from '@utils/attachment-names';
import { FC } from 'react';

import { AttachmentList } from './attachment-list.component';

interface ErrandAttachmentsProps {
  errandId: string;
  /** The errand-level attachments (application / generated / errand files; conversation files excluded). */
  attachments: Attachment[];
  isLoading: boolean;
  loadError: boolean;
  /** Re-fetches the attachment list; kept so the parent can refresh after external changes. */
  refresh: () => void;
  /** Heading shown above the list. */
  heading?: string;
}

export const ErrandAttachments: FC<ErrandAttachmentsProps> = ({
  errandId,
  attachments,
  isLoading,
  loadError,
  heading = 'Bilagor',
}) => {
  const summaryAttachment = attachments.find(
    (attachment) => (attachment.fileName ?? '').toLowerCase() === SUMMARY_PDF
  );

  return (
    <div className="flex flex-col gap-16">
      {summaryAttachment?.id ?
        <PdfPreview
          errandId={errandId}
          attachmentId={summaryAttachment.id}
          title="Sammanställning bilagor från ansökan"
        />
      : null}

      <div className="flex flex-col gap-16">
        <span className="font-bold">{heading}</span>

        {isLoading ?
          <Spinner size={3} />
        : loadError ?
          <p className="m-0">Det gick inte att hämta bilagor</p>
        : <AttachmentList errandId={errandId} attachments={attachments} />}
      </div>
    </div>
  );
};
