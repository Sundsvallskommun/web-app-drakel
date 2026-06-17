'use client';

import 'dayjs/locale/sv';

import { downloadMessageAttachment, Message } from '@services/errand-service/errand-service';
import { useUserStore } from '@services/user-service/user-service';
import { Avatar, Button, cx, Label } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { CornerUpLeft, Download, Paperclip, Reply, UserRound } from 'lucide-react';
import { FC, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

dayjs.extend(relativeTime);

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
  return date.isSame(dayjs(), 'day') ? date.locale('sv').fromNow() : date.format('HH:mm');
};

const formatAbsolute = (created: string): string => dayjs(created).format('YYYY-MM-DD, HH:mm');

/**
 * A single conversation message rendered as a thread row: sender avatar + a content card holding the
 * header (name · time · "Senaste"), an optional quoted reply (click to jump to it), the body and any
 * attachments. The handläggare can reply to any message via the "Svara" action.
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
    <article className="flex gap-12">
      <Avatar
        size="sm"
        accent
        rounded
        color={outbound ? 'bjornstigen' : 'gronsta'}
        className="shrink-0 mt-4"
        {...(outbound ?
          { initials: getInitials(avatarSource) }
        : { imageElement: <UserRound size={18} strokeWidth={1.75} /> })}
      />
      <div
        className={cx(
          'min-w-0 grow flex flex-col gap-y-8 rounded-16 border-1 border-divider bg-background-content px-16 py-12 transition-shadow',
          isHighlighted && 'ring-2 ring-vattjom-surface-primary'
        )}
      >
        <header className="flex items-start justify-between gap-12">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2 min-w-0">
            <span className="font-bold text-body truncate">{sender}</span>
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
          </div>
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
        </header>

        {message.inReplyToId ?
          repliedMessage ?
            <button
              type="button"
              className="flex items-start gap-8 text-left rounded-8 border-l-4 border-vattjom-surface-primary bg-background-200 px-12 py-8 transition hover:brightness-95"
              aria-label="Hoppa till det citerade meddelandet"
              onClick={() => {
                if (repliedMessage.id) {
                  onJumpTo(repliedMessage.id);
                }
              }}
            >
              <CornerUpLeft size={16} className="shrink-0 mt-2 text-secondary" />
              <span className="flex flex-col gap-y-2 min-w-0">
                <span className="text-small font-bold">{senderLabel(repliedMessage, username)}</span>
                <span className="text-small text-secondary line-clamp-2 break-words">
                  {messagePreview(repliedMessage)}
                </span>
              </span>
            </button>
          : <div className="flex items-center gap-8 rounded-8 border-l-4 border-divider bg-background-200 px-12 py-8 text-small text-secondary">
              <CornerUpLeft size={16} className="shrink-0" />
              Svar på ett tidigare meddelande
            </div>

        : null}

        <p className="m-0 whitespace-pre-wrap break-words text-body leading-relaxed">{message.body}</p>

        {message.attachments?.length ?
          <div className="flex flex-col gap-6 items-start">
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
    </article>
  );
};
