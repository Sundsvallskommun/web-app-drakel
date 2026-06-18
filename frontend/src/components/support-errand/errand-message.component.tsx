'use client';

import { Attachment } from '@data-contracts/backend/data-contracts';
import { downloadMessageAttachment, Message } from '@services/errand-service/errand-service';
import { useUserStore } from '@services/user-service/user-service';
import { Avatar, Button, cx, Label, Spinner } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import localeSv from 'dayjs/locale/sv';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CornerUpLeft, Download, Eye, Paperclip, Reply, UserRound } from 'lucide-react';
import { FC, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { AttachmentPreviewModal, isPreviewableAttachment } from './attachment-preview-modal.component';

dayjs.extend(relativeTime);
// Import the locale as a VALUE and register it — a bare `import 'dayjs/locale/sv'` gets tree-shaken,
// which left fromNow() in English.
dayjs.locale(localeSv);

/** OUTBOUND = handläggare (our side); anything else is the applicant ("Sökande"). */
export const senderLabel = (message: Message, username?: string): string => {
  if (message.direction !== 'OUTBOUND') {
    return 'Sökande';
  }
  if (message.author && message.author === username) {
    return 'Jag';
  }
  if (message.author) {
    return `${message.author} (Handläggare)`;
  }
  return 'Handläggare';
};

// First non-blank value (store defaults are empty strings, so `||`/`??` won't do).
const firstNonEmpty = (...values: (string | undefined)[]): string => {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return '';
};

/** Short text shown when quoting/replying to a message; falls back when the message is attachment-only. */
export const messagePreview = (message: Message): string => firstNonEmpty(message.body, 'Bifogad fil');

// Avatar initials: first + last initial for a full name, otherwise the first two letters.
const getInitials = (value: string): string => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  if (!first) {
    return '?';
  }
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
  if (!last) {
    return first.slice(0, 2).toUpperCase();
  }
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
};

// Same-day messages read better relative ("för 3 min sedan"); older ones show the time, since the
// day is already carried by the date divider above the group.
const formatTimeLabel = (created: string): string => {
  const date = dayjs(created);
  return date.isSame(dayjs(), 'day') ? date.fromNow() : date.format('HH:mm');
};

const formatAbsolute = (created: string): string => dayjs(created).format('YYYY-MM-DD, HH:mm');

/**
 * A single conversation message. Every message is left-aligned and fills the available width (no
 * right/left hopping per sender) so the thread reads like a clean, top-to-bottom list — easier for
 * non-technical handläggare to follow. The sender is still distinguished by avatar + bubble colour:
 * OUTBOUND (the handläggare's own) gets a soft blue bubble, INBOUND (the applicant) a neutral one.
 * Above the bubble a meta row carries name · time · "Senaste" + the "Svara" action; inside it an
 * optional quoted reply (click to jump to it) and the body; attachments render below.
 */
export const ErrandMessage: FC<{
  message: Message;
  errandId: string;
  isLatest?: boolean;
  isHighlighted?: boolean;
  /** The message this one replies to, resolved by the parent; absent when not a reply (or unavailable). */
  repliedMessage?: Message;
  onReply: (message: Message) => void;
  onJumpTo: (messageId: string) => void;
}> = ({ message, errandId, isLatest = false, isHighlighted = false, repliedMessage, onReply, onJumpTo }) => {
  const { username, name } = useUserStore(
    useShallow((state) => ({ username: state.user.username, name: state.user.name }))
  );
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<string>();
  const [downloadError, setDownloadError] = useState<string>();
  const [previewAttachment, setPreviewAttachment] = useState<Attachment>();

  // Build the unified Attachment shape the preview/download service expects from a message attachment:
  // it's a conversation file, so origin + the owning messageId route it through the message endpoint.
  const toPreviewAttachment = (messageAttachment: NonNullable<Message['attachments']>[number]): Attachment => ({
    id: messageAttachment.id,
    fileName: messageAttachment.fileName,
    mimeType: messageAttachment.mimeType,
    origin: 'CONVERSATION',
    messageId: message.id,
  });

  const outbound = message.direction === 'OUTBOUND';
  const sender = senderLabel(message, username);
  // Initials come from the real identity (the logged-in user's display name for "Jag", otherwise the
  // message author), so the avatar reads like the reference design rather than a generic glyph.
  const avatarSource =
    outbound && message.author === username ?
      firstNonEmpty(name, username, 'Jag')
    : firstNonEmpty(message.author, outbound ? 'Handläggare' : 'Sökande');

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
    <article className="flex items-start gap-12">
      <Avatar
        size="sm"
        accent
        rounded
        color={outbound ? 'bjornstigen' : 'gronsta'}
        className="shrink-0"
        {...(outbound ?
          { initials: getInitials(avatarSource) }
        : { imageElement: <UserRound size={18} strokeWidth={1.75} /> })}
      />
      <div className="flex flex-col gap-y-4 min-w-0 w-full items-start">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 max-w-full px-2">
          <span className="font-bold text-body text-small truncate">{sender}</span>
          {message.created ?
            <time
              dateTime={message.created}
              title={formatAbsolute(message.created)}
              className="text-small text-secondary"
            >
              <span className="sr-only">Skickat </span>
              {formatTimeLabel(message.created)}
            </time>
          : null}
          {isLatest ?
            <Label rounded inverted color="vattjom" className="text-small">
              Senaste
            </Label>
          : null}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Reply size={16} />}
            className="shrink-0"
            aria-label={`Svara på meddelande från ${sender}`}
            onClick={() => {
              onReply(message);
            }}
          >
            Svara
          </Button>
        </div>

        {/* Sender shown by colour only (not side): OUTBOUND = soft blue bubble, INBOUND = neutral. */}
        <div
          className={cx(
            'flex flex-col gap-y-14 rounded-16 border-1 px-16 py-14 w-full shadow-sm',
            outbound ?
              'border-vattjom-background-300 bg-vattjom-surface-accent text-vattjom-text-primary'
            : 'border-divider bg-background-content text-body',
            isHighlighted && 'ring-2 ring-warning-surface-primary'
          )}
        >
          {message.inReplyToId ?
            repliedMessage ?
              <button
                type="button"
                className={cx(
                  'group flex w-full min-w-0 items-stretch overflow-hidden rounded-12 border-1 text-left shadow-sm transition hover:shadow-md',
                  outbound ?
                    'border-vattjom-background-300 bg-background-content text-body hover:bg-background-100'
                  : 'border-divider bg-background-200 text-body hover:bg-background-100'
                )}
                aria-label="Hoppa till det citerade meddelandet"
                onClick={() => {
                  if (repliedMessage.id) {
                    onJumpTo(repliedMessage.id);
                  }
                }}
              >
                <span className="w-6 shrink-0 bg-vattjom-surface-primary" aria-hidden />
                <span className="flex min-w-0 flex-1 flex-col gap-y-4 px-12 py-10">
                  <span className="flex items-center gap-6 text-small font-bold text-body">
                    <CornerUpLeft size={16} className="shrink-0 text-vattjom-surface-primary" />
                    <span>Svarar på {senderLabel(repliedMessage, username)}</span>
                  </span>
                  <span className="text-small line-clamp-2 break-words text-secondary">
                    {messagePreview(repliedMessage)}
                  </span>
                </span>
              </button>
            : <div
                className={cx(
                  'flex items-center gap-8 rounded-12 border-1 border-l-4 px-12 py-10 text-small shadow-sm',
                  outbound ?
                    'border-vattjom-background-300 border-l-vattjom-surface-primary bg-background-content text-secondary'
                  : 'border-divider border-l-vattjom-surface-primary bg-background-200 text-secondary'
                )}
              >
                <CornerUpLeft size={16} className="shrink-0 text-vattjom-surface-primary" />
                Svar på ett tidigare meddelande
              </div>

          : null}

          <p className="m-0 whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>

          {/* No wrapper card — just a light label, then each attachment as its own outlined chip that
              flows beside the others and wraps where it fits. Colours inherit from the bubble so they
              stay legible on both bubble types; each chip keeps its preview + download actions. */}
          {message.attachments?.length ?
            <section className="flex flex-col gap-6" aria-label="Bilagor">
              <span className="flex items-center gap-6 text-small font-bold">
                <Paperclip size={15} className="shrink-0" />
                {message.attachments.length === 1 ? 'Bilaga' : `${message.attachments.length} bilagor`}
              </span>
              <div className="flex flex-wrap gap-8">
                {message.attachments.map((attachment, index) => {
                  const isDownloading = downloadingAttachmentId === attachment.id;
                  const fileName = attachment.fileName ?? 'bilaga';
                  return (
                    <div
                      key={attachment.id ?? index}
                      className="flex min-w-0 max-w-full items-center gap-4 rounded-8 border-1 border-divider px-10 py-6 text-small"
                    >
                      <span className="min-w-0 truncate text-left">{fileName}</span>
                      {isPreviewableAttachment(toPreviewAttachment(attachment)) ?
                        <button
                          type="button"
                          aria-label={`Förhandsgranska ${fileName}`}
                          className="shrink-0 rounded-4 p-2 transition hover:bg-background-100"
                          onClick={() => {
                            setPreviewAttachment(toPreviewAttachment(attachment));
                          }}
                        >
                          <Eye size={18} />
                        </button>
                      : null}
                      <button
                        type="button"
                        disabled={!message.id || !attachment.id || isDownloading}
                        aria-label={`Ladda ner ${fileName}`}
                        className="shrink-0 rounded-4 p-2 transition hover:bg-background-100 disabled:opacity-60"
                        onClick={() => void downloadAttachment(attachment.id, attachment.fileName)}
                      >
                        {isDownloading ?
                          <Spinner size={2} />
                        : <Download size={18} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          : null}
        </div>

        {downloadError ?
          <p className="m-0 text-small text-error-surface-primary">{downloadError}</p>
        : null}
      </div>

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
