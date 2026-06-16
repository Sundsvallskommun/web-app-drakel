'use client';

import { downloadMessageAttachment, Message } from '@services/errand-service/errand-service';
import { useUserStore } from '@services/user-service/user-service';
import { Avatar, Button } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { Download, UserRound } from 'lucide-react';
import { FC, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { SkSymbol } from './sk-symbol';

const formatTimestamp = (created?: string): string => (created ? dayjs(created).format('YYYY-MM-DD, HH:mm') : '');

/**
 * A single conversation message rendered as a row: sender avatar + name + timestamp, the message
 * body, and any attachments. OUTBOUND = handläggare (our side), INBOUND = the applicant ("Sökande").
 */
export const ErrandMessage: FC<{ message: Message; errandId: string }> = ({ message, errandId }) => {
  const username = useUserStore(useShallow((state) => state.user.username));
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string>();
  const [downloadError, setDownloadError] = useState<string>();

  const outbound = message.direction === 'OUTBOUND';
  const sender =
    outbound ?
      message.author === username ? 'Jag'
      : message.author ? `${message.author} (Handläggare)`
      : 'Handläggare'
    : 'Sökande';

  const downloadAttachment = async (attachmentId?: string, fileName?: string) => {
    if (!message.id || !attachmentId) {
      return;
    }
    setDownloadingAttachmentId(attachmentId);
    setDownloadError(undefined);
    try {
      await downloadMessageAttachment(errandId, message.id, attachmentId, fileName);
    } catch {
      setDownloadError('Det gick inte att hämta filen');
    } finally {
      setDownloadingAttachmentId(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-y-16 py-20 px-8">
      <div className="flex gap-16">
        <Avatar
          size="sm"
          accent
          rounded
          color={outbound ? 'bjornstigen' : 'gronsta'}
          imageElement={outbound ? <SkSymbol /> : <UserRound size={21} />}
        />
        <div className="flex flex-col desktop:flex-row desktop:items-center grow desktop:gap-16">
          <div className="text-large">{sender}</div>
          {message.created ?
            <div className="text-small text-secondary">
              <span className="sr-only">Skickat </span>
              {formatTimestamp(message.created)}
            </div>
          : null}
        </div>
      </div>
      <div className="flex flex-col gap-y-16">
        <span className="whitespace-pre-wrap break-words">{message.body}</span>
        {message.attachments?.length ?
          <div className="flex flex-col gap-4 items-start">
            {message.attachments.map((attachment, index) => (
              <Button
                key={attachment.id ?? index}
                variant="link"
                size="md"
                rightIcon={<Download size={18} />}
                disabled={!message.id || !attachment.id}
                loading={downloadingAttachmentId === attachment.id}
                onClick={() => void downloadAttachment(attachment.id, attachment.fileName)}
              >
                {attachment.fileName ?? 'bilaga'}
              </Button>
            ))}
          </div>
        : null}
        {downloadError ?
          <p className="m-0 text-small text-error-surface-primary">{downloadError}</p>
        : null}
      </div>
    </div>
  );
};
