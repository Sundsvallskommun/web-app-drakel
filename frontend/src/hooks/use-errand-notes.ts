'use client';

import { getNotes, Note } from '@services/note-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandNotesResult {
  notes: Note[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

const timestamp = (note: Note): number => new Date(note.modified ?? note.created ?? 0).getTime();

/** Loads an errand's notes (newest first). Shared by the notes panel and the sidebar count badge. */
export const useErrandNotes = (errandId: string): UseErrandNotesResult => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    void getNotes(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setNotes([]);
      } else {
        setError(undefined);
        setNotes([...(res.data ?? [])].sort((a, b) => timestamp(b) - timestamp(a)));
      }
      setIsLoading(false);
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { notes, isLoading, error, refresh: load };
};
