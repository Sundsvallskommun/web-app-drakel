'use client';

import { ErrandEvent, getErrandEvents } from '@services/event-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandEventsResult {
  events: ErrandEvent[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads an errand's activity log, refetching from the server whenever the action/source filter changes. */
export const useErrandEvents = (errandId: string, action?: string, source?: string): UseErrandEventsResult => {
  const [events, setEvents] = useState<ErrandEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    void getErrandEvents(errandId, { action, source }).then((res) => {
      if (res.error) {
        setError(res.error);
        setEvents([]);
      } else {
        setError(undefined);
        setEvents(res.data ?? []);
      }
      setIsLoading(false);
    });
  }, [errandId, action, source]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, isLoading, error, refresh: load };
};
