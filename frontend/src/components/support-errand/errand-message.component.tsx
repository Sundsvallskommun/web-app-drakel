'use client';

import { Attachment } from '@data-contracts/backend/data-contracts';
import { downloadMessageAttachment, Message } from '@services/errand-service/errand-service';
import { useUserStore } from '@services/user-service/user-service';
import { Button, cx } from '@sk-web-gui/react';
import { htmlToPlainText } from '@utils/sanitize-html';
import dayjs from 'dayjs';
import type { TFunction } from 'i18next';
import { CornerUpLeft, Reply } from 'lucide-react';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { AttachmentPreviewModal, isPreviewableAttachment } from './attachment-preview-modal.component';
import { MessageAttachmentChip } from './message-attachment-chip.component';
import { RecordBodyText } from './record-body-text.component';

/** The logged-in handläggare, used to name their own messages. */
export interface CurrentUser {
  username?: string;
  name?: string;
}

/** OUTBOUND = handläggare (our side); anything else is the applicant ("Sökande"). */
export const senderLabel = (message: Message, t: TFunction, currentUser?: CurrentUser): string => {
  if (message.direction !== 'OUTBOUND') {
    return t('messages:sender.applicant');
  }
  if (message.author && message.author === currentUser?.username) {
    // The user store defaults the name to an empty string before it has loaded.
    if (currentUser.name) {
      return currentUser.name;
    }
    return t('messages:sender.me');
  }
  if (message.author) {
    return t('messages:sender.namedCaseWorker', { author: message.author });
  }
  return t('messages:sender.caseWorker');
};

/** Short text shown when quoting/replying to a message; falls back when the message is attachment-only. */
export const messagePreview = (message: Message, t: TFunction): string => {
  // An attachment-only message has an empty body; `??` alone wouldn't catch the empty string.
  const body = message.body ? htmlToPlainText(message.body) : '';
  if (body) {
    return body;
  }
  return t('messages:message.attachmentOnly');
};

const formatMessageTimestamp = (created: string): string => dayjs(created).format('YYYY-MM-DD, HH:mm');

/** The quoted message a reply points at; clicking it jumps to (and highlights) the original in the thread. */
const RepliedMessageQuote: FC<{
  repliedMessage?: Message;
  currentUser?: CurrentUser;
  onJumpTo: (messageId: string) => void;
}> = ({ repliedMessage, currentUser, onJumpTo }) => {
  const { t } = useTranslation('messages');
  if (!repliedMessage) {
    return (
      <div className="flex items-center gap-8 rounded-8 border-l-4 border-vattjom-surface-primary bg-background-content px-12 py-8 text-small text-dark-secondary">
        <CornerUpLeft size={16} className="shrink-0 text-vattjom-surface-primary" />
        {t('message.replyToEarlierMessage')}
      </div>
    );
  }
  return (
    <button
      type="button"
      className="flex w-full min-w-0 flex-col gap-4 rounded-8 border-l-4 border-vattjom-surface-primary bg-background-content px-12 py-8 text-left transition hover:bg-background-100"
      aria-label={t('message.jumpToQuoted')}
      onClick={() => {
        if (repliedMessage.id) {
          onJumpTo(repliedMessage.id);
        }
      }}
    >
      <span className="flex items-center gap-6 text-small font-bold text-dark-primary">
        <CornerUpLeft size={16} className="shrink-0 text-vattjom-surface-primary" />
        {t('message.replyingTo', { sender: senderLabel(repliedMessage, t, currentUser) })}
      </span>
      <span className="line-clamp-2 break-words text-small text-dark-secondary">
        {messagePreview(repliedMessage, t)}
      </span>
    </button>
  );
};

/**
 * A single conversation message: a meta row (sender, timestamp and a discreet "Svara" action) above a
 * rounded box holding an optional reply quote, the shared files and the body. The handläggare's own
 * messages (OUTBOUND) get a light blue box, the applicant's (INBOUND) a grey one.
 */
export const ErrandMessage: FC<{
  message: Message;
  errandId: string;
  isHighlighted?: boolean;
  /** The message this one replies to, resolved by the parent; absent when not a reply (or unavailable). */
  repliedMessage?: Message;
  onReply: (message: Message) => void;
  onJumpTo: (messageId: string) => void;
}> = ({ message, errandId, isHighlighted = false, repliedMessage, onReply, onJumpTo }) => {
  const { t } = useTranslation('messages');
  const currentUser = useUserStore(useShallow((state) => ({ username: state.user.username, name: state.user.name })));
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string>();
  const [downloadError, setDownloadError] = useState<string>();
  const [previewAttachment, setPreviewAttachment] = useState<Attachment>();

  // Build the unified Attachment shape the preview/download service expects from a message attachment:
  // it's a conversation file, so documentType + the owning messageId route it through the message endpoint.
  const toPreviewAttachment = (messageAttachment: NonNullable<Message['attachments']>[number]): Attachment => ({
    id: messageAttachment.id,
    fileName: messageAttachment.fileName,
    mimeType: messageAttachment.mimeType,
    documentType: 'CONVERSATION',
    messageId: message.id,
  });

  const isOutbound = message.direction === 'OUTBOUND';
  const sender = senderLabel(message, t, currentUser);

  const downloadAttachment = async (attachmentId?: string, fileName?: string) => {
    if (!message.id || !attachmentId) {
      return;
    }
    setDownloadingAttachmentId(attachmentId);
    setDownloadError(undefined);
    try {
      await downloadMessageAttachment(errandId, message.id, attachmentId, fileName);
    } catch {
      setDownloadError(t('attachments:downloadError'));
    } finally {
      setDownloadingAttachmentId(undefined);
    }
  };

  return (
    <article className="flex flex-col gap-8">
      <div className="flex min-h-32 flex-wrap items-center gap-x-16 gap-y-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-16 gap-y-2">
          <span className="truncate text-dark-primary">{sender}</span>
          {message.created ?
            <time dateTime={message.created} className="text-small text-dark-secondary">
              <span className="sr-only">{t('message.sent')}</span>
              {formatMessageTimestamp(message.created)}
            </time>
          : null}
        </div>
        <Button
          variant="tertiary"
          showBackground={false}
          size="sm"
          iconButton
          leftIcon={<Reply />}
          className="shrink-0"
          aria-label={t('message.reply', { sender })}
          onClick={() => {
            onReply(message);
          }}
        />
      </div>

      <div
        className={cx(
          'flex w-full flex-col gap-24 rounded-8 p-20 text-dark-primary transition-shadow',
          isOutbound ? 'bg-vattjom-background-100' : 'bg-background-200',
          isHighlighted && 'ring-2 ring-warning-surface-primary'
        )}
      >
        {message.inReplyToId ?
          <RepliedMessageQuote repliedMessage={repliedMessage} currentUser={currentUser} onJumpTo={onJumpTo} />
        : null}

        {message.attachments?.length ?
          <section className="flex flex-wrap gap-16" aria-label={t('attachments:title')}>
            {message.attachments.map((attachment, index) => (
              <MessageAttachmentChip
                key={attachment.id ?? index}
                fileName={attachment.fileName ?? t('attachments:fallbackFileName')}
                canPreview={isPreviewableAttachment(toPreviewAttachment(attachment))}
                isDownloading={downloadingAttachmentId === attachment.id}
                downloadDisabled={!message.id || !attachment.id}
                onPreview={() => {
                  setPreviewAttachment(toPreviewAttachment(attachment));
                }}
                onDownload={() => void downloadAttachment(attachment.id, attachment.fileName)}
              />
            ))}
          </section>
        : null}

        {message.body ?
          <RecordBodyText text={message.body} />
        : null}
      </div>

      {downloadError ?
        <p className="m-0 text-small text-error-surface-primary">{downloadError}</p>
      : null}

      <AttachmentPreviewModal
        errandId={errandId}
        attachment={previewAttachment}
        onClose={() => {
          setPreviewAttachment(undefined);
        }}
      />
    </article>
  );
};
