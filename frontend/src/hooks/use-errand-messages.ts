'use client';

import { getErrandMessages, Message } from '@services/errand-service/errand-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandMessagesResult {
  messages: Message[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads the conversation messages for an errand. Fetched separately from the errand itself. */
export const useErrandMessages = (errandId: string): UseErrandMessagesResult => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();
  // Bumped by refresh() to re-run the effect; keeps fetch + cancellation in one place.
  const [reloadToken, setReloadToken] = useState<number>(0);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!errandId) {
      return;
    }
    // Guard against out-of-order resolutions and setState-after-unmount: a stale fetch (errandId
    // changed, or the tab was left before it resolved) must not overwrite the current state.
    let cancelled = false;
    setIsLoading(true);
    void getErrandMessages(errandId).then((res) => {
      if (cancelled) {
        return;
      }
      if (res.error) {
        setError(res.error);
        setMessages([]);
      } else {
        setError(undefined);
        setMessages(res.data ?? []);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [errandId, reloadToken]);

  return { messages, isLoading, error, refresh };
};
