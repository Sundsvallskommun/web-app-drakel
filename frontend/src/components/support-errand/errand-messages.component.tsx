'use client';

import { useErrandMessages } from '@hooks/use-errand-messages';
import { Message } from '@services/errand-service/errand-service';
import { Button, Spinner, Tabs } from '@sk-web-gui/react';
import { getInitials } from '@utils/get-initials';
import { ArrowDown, MessageSquare } from 'lucide-react';
import { FC, ReactNode, UIEvent, useEffect, useMemo, useRef, useState } from 'react';

import { ConversationHeader } from './conversation-header.component';
import { ErrandMessage } from './errand-message.component';
import { ErrandNewMessage } from './errand-new-message.component';

// Messages are revealed in pages so a long thread doesn't render all at once.
const PAGE_SIZE = 24;
// How long a jumped-to message stays highlighted after "Hoppa till".
const HIGHLIGHT_DURATION_MS = 2000;
const MESSAGES_TAB = 0;
const SHARED_ATTACHMENTS_TAB = 1;

interface ErrandMessagesProps {
  errandId: string;
  /** The applicant(s) the conversation is held with; shown as the conversation's counterpart. */
  applicantNames?: string[];
  errandNumber?: string;
  /** Content of the "Delade bilagor" tab: the files shared in the conversation. */
  sharedAttachments: ReactNode;
}

/**
 * The errand's conversation. An errand has exactly one conversation (handläggare ↔ sökande) in one channel, so
 * there is no conversation list: the header names the counterpart, and its tabs switch between the thread
 * (with the composer) and the files shared in it.
 */
export const ErrandMessages: FC<ErrandMessagesProps> = ({
  errandId,
  applicantNames = [],
  errandNumber,
  sharedAttachments,
}) => {
  const { messages, isLoading, error, refresh } = useErrandMessages(errandId);
  const counterpartName = applicantNames.length ? applicantNames.join(', ') : 'Sökande';
  const counterpartInitials = getInitials(applicantNames[0] ?? 'Sökande');
  const [activeTab, setActiveTab] = useState<number>(MESSAGES_TAB);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [replyTo, setReplyTo] = useState<Message>();
  const [highlightId, setHighlightId] = useState<string>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Resolve a reply's parent from the full thread (not the revealed page), so quotes render even when
  // the quoted message is still paged out.
  const messagesById = useMemo(() => {
    const map = new Map<string, Message>();
    for (const message of messages) {
      if (message.id) {
        map.set(message.id, message);
      }
    }
    return map;
  }, [messages]);

  const visible = messages.slice(Math.max(messages.length - visibleCount, 0));
  const hasMore = visibleCount < messages.length;

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) {
      return;
    }
    scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior });
  };

  const updateScrollButton = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    setShowScrollButton(distanceToBottom > 80);
  };

  // Stick to the newest message whenever the thread grows (initial load + after sending).
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom('auto');
    });
  }, [messages.length]);

  // Scroll to (and briefly highlight) a jumped-to message once it is in the DOM. Re-runs when the
  // revealed page grows, so a quote pointing at a paged-out message still lands.
  useEffect(() => {
    if (!highlightId) {
      return;
    }
    const target = scrollAreaRef.current?.querySelector(`#message-${CSS.escape(highlightId)}`);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => {
      setHighlightId(undefined);
    }, HIGHLIGHT_DURATION_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [highlightId, visibleCount]);

  const jumpToMessage = (messageId: string) => {
    const index = messages.findIndex((message) => message.id === messageId);
    if (index === -1) {
      return;
    }
    // Reveal enough of the thread for the target to exist before the scroll effect runs.
    setVisibleCount((prev) => Math.max(prev, messages.length - index));
    setHighlightId(messageId);
  };

  const handleSent = () => {
    refresh();
    setReplyTo(undefined);
  };

  const thread = (
    <>
      <div className="relative flex min-h-[26rem] flex-1 flex-col">
        {isLoading ?
          <div className="flex flex-1 items-center justify-center">
            <Spinner size={3} />
          </div>
        : error ?
          <div className="flex flex-1 items-center justify-center px-20 text-center">
            <p className="m-0">Det gick inte att hämta meddelanden ({String(error)})</p>
          </div>
        : messages.length ?
          <div
            ref={scrollAreaRef}
            className="max-h-[62vh] flex-1 overflow-y-auto px-20 pt-40 pb-24 md:px-40 desktop:max-h-none desktop:basis-0"
            onScroll={updateScrollButton}
            role="log"
            aria-label="Ärendemeddelanden"
            aria-live="polite"
          >
            {hasMore ?
              <div className="flex justify-center pb-24">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setVisibleCount((prev) => prev + PAGE_SIZE);
                  }}
                >
                  Visa äldre meddelanden
                </Button>
              </div>
            : null}
            <ul className="m-0 p-0 list-none flex flex-col gap-40">
              {visible.map((message, index) => (
                <li
                  id={message.id ? `message-${message.id}` : undefined}
                  key={message.id ?? index}
                  className="scroll-mt-16"
                >
                  <ErrandMessage
                    message={message}
                    errandId={errandId}
                    isHighlighted={message.id === highlightId}
                    repliedMessage={message.inReplyToId ? messagesById.get(message.inReplyToId) : undefined}
                    onReply={setReplyTo}
                    onJumpTo={jumpToMessage}
                  />
                </li>
              ))}
            </ul>
          </div>
        : <div className="flex flex-1 flex-col items-center justify-center gap-12 px-20 text-center text-dark-secondary">
            <MessageSquare size={42} />
            <div>
              <p className="m-0 font-bold">Inga meddelanden än</p>
              <p className="m-0 text-small">Skriv ett meddelande nedan för att starta dialogen.</p>
            </div>
          </div>
        }
        {showScrollButton ?
          <Button
            className="absolute bottom-16 right-16 shadow-lg"
            size="sm"
            color="vattjom"
            iconButton
            aria-label="Gå till senaste meddelandet"
            leftIcon={<ArrowDown />}
            onClick={() => {
              scrollToBottom();
            }}
          />
        : null}
      </div>

      <div className="px-20 py-16 md:px-40">
        <ErrandNewMessage
          errandId={errandId}
          replyTo={replyTo}
          onCancelReply={() => {
            setReplyTo(undefined);
          }}
          onSent={handleSent}
        />
      </div>
    </>
  );

  return (
    // The conversation fills the errand's content card: header with the counterpart and the Meddelanden /
    // Delade bilagor tabs, then the active tab's content.
    <section
      className="flex min-h-[52rem] flex-col desktop:h-[min(85vh,89.5rem)]"
      aria-label={`Konversation med ${counterpartName}`}
    >
      <ConversationHeader name={counterpartName} initials={counterpartInitials} errandNumber={errandNumber} />

      <Tabs
        size="sm"
        className="flex min-h-0 flex-1 flex-col"
        tabslistClassName="px-20 md:pl-40 md:pr-16 border-b-1 border-divider"
        panelsClassName="flex min-h-0 flex-1 flex-col"
        current={activeTab}
        onTabChange={setActiveTab}
      >
        <Tabs.Item>
          <Tabs.Button>Meddelanden</Tabs.Button>
          <Tabs.Content className="flex min-h-0 flex-1 flex-col">
            {activeTab === MESSAGES_TAB ? thread : null}
          </Tabs.Content>
        </Tabs.Item>
        <Tabs.Item>
          <Tabs.Button>Delade bilagor</Tabs.Button>
          <Tabs.Content className="min-h-0 flex-1 overflow-y-auto px-20 py-40 md:px-40">
            {activeTab === SHARED_ATTACHMENTS_TAB ? sharedAttachments : null}
          </Tabs.Content>
        </Tabs.Item>
      </Tabs>
    </section>
  );
};
