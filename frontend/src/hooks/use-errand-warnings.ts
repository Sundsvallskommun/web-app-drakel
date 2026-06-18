'use client';

import { getWarnings, Warning } from '@services/warning-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandWarningsResult {
  warnings: Warning[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads an errand's EB income warnings. Shared by the sidebar panel and its count badge. */
export const useErrandWarnings = (errandId: string): UseErrandWarningsResult => {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    void getWarnings(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setWarnings([]);
      } else {
        setError(undefined);
        setWarnings(res.data ?? []);
      }
      setIsLoading(false);
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { warnings, isLoading, error, refresh: load };
};
