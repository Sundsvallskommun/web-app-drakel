'use client';

import { PdfPreview } from '@components/common/pdf-preview.component';
import { Attachment } from '@data-contracts/backend/data-contracts';
import { Spinner } from '@sk-web-gui/react';
import { SUMMARY_PDF } from '@utils/attachment-names';
import { FC } from 'react';

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
  heading = 'Bilagor',
}) => {
  const summaryAttachment = attachments.find((attachment) => (attachment.fileName ?? '').toLowerCase() === SUMMARY_PDF);

  return (
    <div className="flex flex-col gap-40">
      <ErrandSectionHeader title="Bilagor" description="Här samlas bilagor som är kopplade till ärendet." />

      <AttachmentUploadField errandId={errandId} onUploaded={refresh} />

      {summaryAttachment?.id ?
        <PdfPreview
          errandId={errandId}
          attachmentId={summaryAttachment.id}
          title="Sammanställning bilagor från ansökan"
        />
      : null}

      {isLoading ?
        <Spinner size={3} />
      : loadError ?
        <p className="m-0">Det gick inte att hämta bilagor</p>
      : <>
          <AttachmentList errandId={errandId} attachments={attachments} heading={heading} />
          {messageAttachments ?
            <AttachmentList
              errandId={errandId}
              attachments={messageAttachments}
              heading="Bilagor från meddelanden"
              placeholder="Inga bilagor i meddelanden"
            />
          : null}
        </>
      }
    </div>
  );
};
