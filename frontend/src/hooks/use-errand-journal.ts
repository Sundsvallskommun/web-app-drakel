'use client';

import { getJournalEntries, getJournalTypes, JournalEntry, JournalEntryType } from '@services/journal-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandJournalResult {
  entries: JournalEntry[];
  types: JournalEntryType[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads an errand's journalanteckningar and the selectable journal entry types. */
export const useErrandJournal = (errandId: string): UseErrandJournalResult => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [types, setTypes] = useState<JournalEntryType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    void getJournalEntries(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setEntries([]);
      } else {
        setError(undefined);
        setEntries(res.data ?? []);
      }
      setIsLoading(false);
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    void getJournalTypes().then((res) => {
      if (!res.error) {
        setTypes(res.data ?? []);
      }
    });
  }, []);

  return { entries, types, isLoading, error, refresh: load };
};
