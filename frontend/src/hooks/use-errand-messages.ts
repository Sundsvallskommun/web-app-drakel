'use client';

import { getErrandMessages, Message } from '@services/errand-service/errand-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandMessagesResult {
  messages: Message[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_MESSAGES: Message[] = [];

/** Loads the conversation messages for an errand. Fetched separately from the errand itself. */
export const useErrandMessages = (errandId: string): UseErrandMessagesResult => {
  const fetchMessages = useCallback(() => getErrandMessages(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchMessages, { initialData: NO_MESSAGES, ready: !!errandId });
  return { messages: data, ...query };
};
