'use client';

import { getNotes, Note } from '@services/note-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandNotesResult {
  notes: Note[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_NOTES: Note[] = [];

const timestamp = (note: Note): number => new Date(note.modified ?? note.created ?? 0).getTime();
const newestFirst = (notes: Note[]): Note[] => [...notes].sort((a, b) => timestamp(b) - timestamp(a));

/**
 * Loads an errand's notes (newest first). `enabled` gates the fetch so the notes panel only reads when
 * its sidebar section is opened (avoids logging a read on every errand open).
 */
export const useErrandNotes = (errandId: string, enabled = true): UseErrandNotesResult => {
  const fetchNotes = useCallback(() => getNotes(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchNotes, {
    initialData: NO_NOTES,
    enabled: enabled && !!errandId,
    select: newestFirst,
  });
  return { notes: data, ...query };
};
