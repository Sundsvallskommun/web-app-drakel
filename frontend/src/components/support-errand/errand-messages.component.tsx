'use client';

import { useErrandMessages } from '@hooks/use-errand-messages';
import { Button, Divider, Spinner } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { ArrowDown, MessageSquare } from 'lucide-react';
import { FC, UIEvent, useEffect, useRef, useState } from 'react';

import { ErrandMessage } from './errand-message.component';
import { ErrandNewMessage } from './errand-new-message.component';

// Messages are revealed in pages so a long thread doesn't render all at once.
const PAGE_SIZE = 24;

const formatDateDivider = (created?: string): string => {
  if (!created) {
    return 'Utan datum';
  }
  const date = dayjs(created);
  if (date.isSame(dayjs(), 'day')) {
    return 'Idag';
  }
  if (date.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return 'Igår';
  }
  return date.format('YYYY-MM-DD');
};

export const ErrandMessages: FC<{ errandId: string }> = ({ errandId }) => {
  const { messages, isLoading, error, refresh } = useErrandMessages(errandId);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const visible = messages.slice(Math.max(messages.length - visibleCount, 0));
  const hasMore = visibleCount < messages.length;
  const latestMessageId = messages.at(-1)?.id;

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

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollToBottom('auto');
    });
  }, [messages.length]);

  return (
    <div className="rounded-12 border-1 border-divider bg-background-content flex flex-col overflow-hidden h-[min(72vh,760px)] min-h-[560px]">
      <div className="border-b-1 border-divider px-20 py-16 desktop:px-32">
        <div className="flex flex-col gap-8 desktop:flex-row desktop:items-center desktop:justify-between">
          <div>
            <h2 className="text-large font-bold m-0">Meddelanden</h2>
            <p className="text-small text-secondary m-0">
              {messages.length ?
                `${messages.length} ${messages.length === 1 ? 'meddelande' : 'meddelanden'}`
              : 'Inga meddelanden'}
            </p>
          </div>
          <span className="text-small text-secondary">Äldst överst, senaste längst ned</span>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 bg-background-100">
        {isLoading ?
          <div className="h-full flex items-center justify-center">
            <Spinner size={3} />
          </div>
        : error ?
          <div className="h-full flex items-center justify-center px-20 text-center">
            <p className="m-0">Det gick inte att hämta meddelanden ({String(error)})</p>
          </div>
        : messages.length ?
          <div
            ref={scrollAreaRef}
            className="h-full overflow-y-auto px-16 py-20 desktop:px-32"
            onScroll={updateScrollButton}
            role="log"
            aria-label="Ärendemeddelanden"
            aria-live="polite"
          >
            {hasMore ?
              <div className="flex justify-center pb-16">
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
            <ul className="flex flex-col gap-y-16">
              {visible.map((message, index) => (
                <li
                  id={message.id ? `message-${message.id}` : undefined}
                  key={message.id ?? index}
                  className="flex flex-col gap-y-12"
                >
                  {(
                    index === 0 || formatDateDivider(message.created) !== formatDateDivider(visible[index - 1]?.created)
                  ) ?
                    <div className="flex items-center gap-12">
                      <Divider className="m-0 grow" />
                      <span className="text-small text-secondary whitespace-nowrap">
                        {formatDateDivider(message.created)}
                      </span>
                      <Divider className="m-0 grow" />
                    </div>
                  : null}
                  <ErrandMessage message={message} errandId={errandId} isLatest={message.id === latestMessageId} />
                </li>
              ))}
            </ul>
          </div>
        : <div className="h-full flex flex-col items-center justify-center gap-12 text-center text-secondary px-20">
            <MessageSquare size={42} />
            <div>
              <p className="font-bold text-body m-0">Inga meddelanden än</p>
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

      <div className="border-t-1 border-divider bg-background-content px-20 py-16 desktop:px-32">
        <ErrandNewMessage errandId={errandId} onSent={refresh} />
      </div>
    </div>
  );
};
