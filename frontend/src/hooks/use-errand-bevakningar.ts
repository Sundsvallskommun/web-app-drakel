'use client';

import { Bevakning, getBevakningar } from '@services/bevakning-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandBevakningarResult {
  bevakningar: Bevakning[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/**
 * Loads the bevakningar (date-bound watches/reminders) for an errand. `enabled` gates the fetch so the
 * list is only read when the Bevakningar sidebar section is opened (not on every errand open).
 */
export const useErrandBevakningar = (errandId: string, enabled = true): UseErrandBevakningarResult => {
  const [bevakningar, setBevakningar] = useState<Bevakning[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId || !enabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void getBevakningar(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setBevakningar([]);
      } else {
        setError(undefined);
        setBevakningar(res.data ?? []);
      }
      setIsLoading(false);
    });
  }, [errandId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { bevakningar, isLoading, error, refresh: load };
};
