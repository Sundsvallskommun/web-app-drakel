'use client';

import { downloadMessageAttachment, Message } from '@services/errand-service/errand-service';
import { useUserStore } from '@services/user-service/user-service';
import { Avatar, Badge, Button, cx } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { Download, Paperclip, UserRound } from 'lucide-react';
import { FC, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { SkSymbol } from './sk-symbol';

const formatTimestamp = (created?: string): string => (created ? dayjs(created).format('YYYY-MM-DD, HH:mm') : '');

/**
 * A single conversation message rendered as a row: sender avatar + name + timestamp, the message
 * body, and any attachments. OUTBOUND = handläggare (our side), INBOUND = the applicant ("Sökande").
 */
export const ErrandMessage: FC<{ message: Message; errandId: string; isLatest?: boolean }> = ({
  message,
  errandId,
  isLatest = false,
}) => {
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
    <div className={cx('flex gap-12 items-end', outbound && 'flex-row-reverse')}>
      <Avatar
        size="sm"
        accent
        rounded
        color={outbound ? 'bjornstigen' : 'gronsta'}
        imageElement={outbound ? <SkSymbol /> : <UserRound size={21} />}
        className="shrink-0"
      />
      <div className={cx('flex flex-col gap-y-6 max-w-[min(72rem,85%)]', outbound && 'items-end')}>
        <div
          className={cx(
            'flex flex-wrap items-center gap-x-8 gap-y-4 text-small text-secondary',
            outbound && 'justify-end'
          )}
        >
          <span className="font-bold text-body">{sender}</span>
          {message.created ?
            <span>
              <span className="sr-only">Skickat </span>
              {formatTimestamp(message.created)}
            </span>
          : null}
          {isLatest ?
            <Badge size="sm" color="vattjom" rounded>
              Senast
            </Badge>
          : null}
        </div>
        <div
          className={cx(
            'flex flex-col gap-y-14 rounded-12 border-1 px-16 py-14 shadow-sm',
            outbound ?
              'bg-vattjom-surface-primary text-white border-vattjom-surface-primary rounded-br-4'
            : 'bg-background-content text-body border-divider rounded-bl-4'
          )}
        >
          <span className="whitespace-pre-wrap break-words leading-relaxed">{message.body}</span>
        </div>
        {message.attachments?.length ?
          <div className={cx('flex flex-col gap-6 items-start', outbound && 'items-end')}>
            {message.attachments.map((attachment, index) => (
              <Button
                key={attachment.id ?? index}
                variant="secondary"
                size="sm"
                leftIcon={<Paperclip size={16} />}
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
