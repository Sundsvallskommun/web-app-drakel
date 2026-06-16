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

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    void getErrandMessages(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setMessages([]);
      } else {
        setError(undefined);
        setMessages(res.data ?? []);
      }
      setIsLoading(false);
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { messages, isLoading, error, refresh: load };
};
