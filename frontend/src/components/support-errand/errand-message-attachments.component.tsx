'use client';

import { useErrandAttachments } from '@hooks/use-errand-attachments';
import { Spinner } from '@sk-web-gui/react';
import { FC } from 'react';

import { AttachmentList } from './attachment-list.component';

/**
 * Lists every file shared in the errand's conversation (origin CONVERSATION) in one place — separate
 * from the Bilagor tab, which shows application/generated/errand files. Downloads route through the
 * message endpoint automatically (handled in AttachmentList via each attachment's messageId).
 */
export const ErrandMessageAttachments: FC<{ errandId: string }> = ({ errandId }) => {
  const { attachments, isLoading, error } = useErrandAttachments(errandId);
  const conversationAttachments = attachments.filter((attachment) => attachment.origin === 'CONVERSATION');

  return (
    <div className="flex flex-col gap-16">
      <span className="font-bold">Bilagor från meddelanden</span>

      {isLoading ?
        <Spinner size={3} />
      : error ?
        <p className="m-0">Det gick inte att hämta bilagor ({String(error)})</p>
      : <AttachmentList
          errandId={errandId}
          attachments={conversationAttachments}
          placeholder="Inga bilagor i meddelanden"
        />
      }
    </div>
  );
};
