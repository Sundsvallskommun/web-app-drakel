'use client';

import { ErrandEvent, getErrandEvents } from '@services/event-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandEventsResult {
  events: ErrandEvent[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_EVENTS: ErrandEvent[] = [];

/** Loads an errand's activity log, refetching from the server whenever the action/source filter changes. */
export const useErrandEvents = (errandId: string, action?: string, source?: string): UseErrandEventsResult => {
  const fetchEvents = useCallback(() => getErrandEvents(errandId, { action, source }), [errandId, action, source]);
  const { data, ...query } = useServiceQuery(fetchEvents, { initialData: NO_EVENTS, ready: !!errandId });
  return { events: data, ...query };
};
