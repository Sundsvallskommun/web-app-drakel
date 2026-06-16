'use client';

import { useErrandMessages } from '@hooks/use-errand-messages';
import { Button, Divider, Spinner } from '@sk-web-gui/react';
import { FC, useState } from 'react';

import { ErrandMessage } from './errand-message.component';
import { ErrandNewMessage } from './errand-new-message.component';

// Messages are revealed in pages so a long thread doesn't render all at once.
const PAGE_SIZE = 24;

export const ErrandMessages: FC<{ errandId: string }> = ({ errandId }) => {
  const { messages, isLoading, error, refresh } = useErrandMessages(errandId);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  const visible = messages.slice(0, visibleCount);
  const hasMore = visibleCount < messages.length;

  return (
    <div className="rounded-12 border-1 border-divider bg-background-content py-32 flex flex-col gap-y-48 desktop:gap-y-64">
      <div className="flex flex-col gap-y-32 self-stretch">
        <div className="mx-20 desktop:mx-32">
          <ErrandNewMessage errandId={errandId} onSent={refresh} />
        </div>
        <Divider className="m-0 self-stretch" />
      </div>

      <div className="flex flex-col gap-y-16 items-start self-stretch mx-20 desktop:mx-32">
        <div className="text-secondary w-full">
          <span>
            {messages.length ?
              `${messages.length} ${messages.length === 1 ? 'meddelande' : 'meddelanden'}`
            : 'Inga meddelanden'}
          </span>
          <Divider className="mx-0 mb-0 mt-16" />
        </div>

        {isLoading ?
          <Spinner size={3} />
        : error ?
          <p className="m-0">Det gick inte att hämta meddelanden ({String(error)})</p>
        : messages.length ?
          <>
            <ul aria-label="Ärendemeddelanden" className="flex flex-col self-stretch gap-y-8">
              {visible.map((message, index) => (
                <li key={message.id ?? index} className="flex flex-col gap-y-8">
                  <ErrandMessage message={message} errandId={errandId} />
                  {index !== visible.length - 1 ?
                    <Divider className="m-0" />
                  : null}
                </li>
              ))}
            </ul>
            <div className="w-full flex flex-col gap-y-12 items-center">
              <div className="text-secondary text-small">
                Visar {Math.min(visibleCount, messages.length)} av {messages.length}
              </div>
              {hasMore ?
                <Button
                  variant="secondary"
                  onClick={() => {
                    setVisibleCount((prev) => prev + PAGE_SIZE);
                  }}
                >
                  Visa fler
                </Button>
              : null}
            </div>
          </>
        : null}
      </div>
    </div>
  );
};
