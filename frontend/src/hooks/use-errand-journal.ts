'use client';

import { getJournalEntries, getJournalTypes, JournalEntry, JournalEntryType } from '@services/journal-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandJournalResult {
  entries: JournalEntry[];
  types: JournalEntryType[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_ENTRIES: JournalEntry[] = [];
const NO_TYPES: JournalEntryType[] = [];

/** Loads an errand's journalanteckningar and the selectable journal entry types. */
export const useErrandJournal = (errandId: string): UseErrandJournalResult => {
  const fetchEntries = useCallback(() => getJournalEntries(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchEntries, { initialData: NO_ENTRIES, ready: !!errandId });
  // The type list is a best-effort lookup: failing to load it just leaves the type picker empty.
  const { data: types } = useServiceQuery(getJournalTypes, { initialData: NO_TYPES });
  return { entries: data, types, ...query };
};
