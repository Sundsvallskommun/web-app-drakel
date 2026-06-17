'use client';

import { Attachment } from '@data-contracts/backend/data-contracts';
import { Spinner } from '@sk-web-gui/react';
import { FC } from 'react';

import { AttachmentList } from './attachment-list.component';

interface ErrandMessageAttachmentsProps {
  errandId: string;
  /** The conversation attachments (origin CONVERSATION) shared in the errand's messages. */
  attachments: Attachment[];
  isLoading: boolean;
  loadError: boolean;
}

/**
 * Lists every file shared in the errand's conversation (origin CONVERSATION) in one place — separate
 * from the Bilagor tab, which shows application/generated/errand files. Downloads route through the
 * message endpoint automatically (handled in AttachmentList via each attachment's messageId).
 */
export const ErrandMessageAttachments: FC<ErrandMessageAttachmentsProps> = ({
  errandId,
  attachments,
  isLoading,
  loadError,
}) => {
  return (
    <div className="flex flex-col gap-16">
      <span className="font-bold">Bilagor från meddelanden</span>

      {isLoading ?
        <Spinner size={3} />
      : loadError ?
        <p className="m-0">Det gick inte att hämta bilagor</p>
      : <AttachmentList errandId={errandId} attachments={attachments} placeholder="Inga bilagor i meddelanden" />}
    </div>
  );
};
