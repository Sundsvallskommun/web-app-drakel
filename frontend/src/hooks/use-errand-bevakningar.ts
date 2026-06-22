'use client';

import { Bevakning, getBevakningar } from '@services/bevakning-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandBevakningarResult {
  bevakningar: Bevakning[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads the bevakningar (date-bound watches/reminders) for an errand. */
export const useErrandBevakningar = (errandId: string): UseErrandBevakningarResult => {
  const [bevakningar, setBevakningar] = useState<Bevakning[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
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
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { bevakningar, isLoading, error, refresh: load };
};
