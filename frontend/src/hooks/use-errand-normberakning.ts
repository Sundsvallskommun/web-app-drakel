'use client';

import { getNormberakningDraft, NormberakningDraft } from '@services/normberakning-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandNormberakningResult {
  draft?: NormberakningDraft;
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads the draft normberäkning (income rows) for an errand. */
export const useErrandNormberakning = (errandId: string): UseErrandNormberakningResult => {
  const [draft, setDraft] = useState<NormberakningDraft>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    void getNormberakningDraft(errandId).then((res) => {
      // A 404 means no draft normberäkning exists yet for this errand — a normal state, not an error.
      if (res.error && res.error !== 404) {
        setError(res.error);
        setDraft(undefined);
      } else {
        setError(undefined);
        setDraft(res.data ?? undefined);
      }
      setIsLoading(false);
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { draft, isLoading, error, refresh: load };
};
