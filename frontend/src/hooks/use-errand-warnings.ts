'use client';

import { getWarnings, Warning } from '@services/warning-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandWarningsResult {
  warnings: Warning[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

const timestamp = (warning: Warning): number => new Date(warning.created ?? warning.updated ?? 0).getTime();

/**
 * Loads an errand's EB income warnings. `enabled` gates the fetch so warnings are only read when the
 * Varningar sidebar section or the Normberäkning tab is opened (not on every errand open).
 */
export const useErrandWarnings = (errandId: string, enabled = true): UseErrandWarningsResult => {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId || !enabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void getWarnings(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setWarnings([]);
      } else {
        setError(undefined);
        // Newest first, by timestamp.
        setWarnings([...(res.data ?? [])].sort((a, b) => timestamp(b) - timestamp(a)));
      }
      setIsLoading(false);
    });
  }, [errandId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { warnings, isLoading, error, refresh: load };
};
