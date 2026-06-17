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
// Activate Swedish explicitly — a bare locale import can be tree-shaken, leaving fromNow() in English.
dayjs.locale('sv');

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
 * A single conversation message as a chat bubble: OUTBOUND (the handläggare's own, "mine") aligns
 * right in a blue bubble, INBOUND (the applicant) aligns left in a neutral bubble. Above the bubble a
 * meta row carries name · time · "Senaste" + the "Svara" action; inside it an optional quoted reply
 * (click to jump to it) and the body; attachments render below, on the sender's side.
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
    <article className={cx('flex items-start gap-12', outbound && 'flex-row-reverse')}>
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
      <div
        className={cx('flex flex-col gap-y-4 min-w-0 max-w-[min(52rem,80%)]', outbound ? 'items-end' : 'items-start')}
      >
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

        {/* OUTBOUND (mine) = blue bubble right; INBOUND (Sökande) = neutral bubble left. */}
        <div
          className={cx(
            'flex flex-col gap-y-8 rounded-16 px-16 py-12 max-w-full',
            outbound ?
              'bg-vattjom-surface-primary text-white'
            : 'bg-background-content text-body border-1 border-divider',
            isHighlighted && 'ring-2 ring-warning-surface-primary'
          )}
        >
          {message.inReplyToId ?
            repliedMessage ?
              <button
                type="button"
                className={cx(
                  'flex items-start gap-8 text-left rounded-8 border-l-4 px-12 py-8 transition hover:brightness-95',
                  outbound ? 'border-white/60 bg-white/15' : 'border-vattjom-surface-primary bg-background-200'
                )}
                aria-label="Hoppa till det citerade meddelandet"
                onClick={() => {
                  if (repliedMessage.id) {
                    onJumpTo(repliedMessage.id);
                  }
                }}
              >
                <CornerUpLeft
                  size={16}
                  className={cx('shrink-0 mt-2', outbound ? 'text-white/80' : 'text-secondary')}
                />
                <span className="flex flex-col gap-y-2 min-w-0">
                  <span className="text-small font-bold">{senderLabel(repliedMessage, username)}</span>
                  <span
                    className={cx('text-small line-clamp-2 break-words', outbound ? 'text-white/80' : 'text-secondary')}
                  >
                    {messagePreview(repliedMessage)}
                  </span>
                </span>
              </button>
            : <div
                className={cx(
                  'flex items-center gap-8 rounded-8 border-l-4 px-12 py-8 text-small',
                  outbound ?
                    'border-white/40 bg-white/15 text-white/80'
                  : 'border-divider bg-background-200 text-secondary'
                )}
              >
                <CornerUpLeft size={16} className="shrink-0" />
                Svar på ett tidigare meddelande
              </div>

          : null}

          <p className="m-0 whitespace-pre-wrap break-words leading-relaxed">{message.body}</p>
        </div>

        {message.attachments?.length ?
          <div
            className={cx('flex flex-wrap gap-6 max-w-full', outbound ? 'justify-end' : 'justify-start')}
            aria-label="Bilagor"
          >
            {message.attachments.map((attachment, index) => (
              <Button
                key={attachment.id ?? index}
                variant="secondary"
                size="sm"
                className="min-w-0 max-w-full"
                leftIcon={<Paperclip size={16} />}
                rightIcon={<Download size={18} />}
                disabled={!message.id || !attachment.id}
                loading={downloadingAttachmentId === attachment.id}
                onClick={() => void downloadAttachment(attachment.id, attachment.fileName)}
              >
                <span className="truncate">{attachment.fileName ?? 'bilaga'}</span>
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
