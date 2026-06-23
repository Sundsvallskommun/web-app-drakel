'use client';

import { ErrandCounts, getErrandCounts } from '@services/counts-service';
import { useCallback, useEffect, useState } from 'react';

const EMPTY_COUNTS: ErrandCounts = { notes: 0, warnings: 0, bevakningar: 0 };

/**
 * Loads an errand's sidebar badge counts. The underlying endpoints are unlogged, so these load eagerly
 * with the errand (the lists themselves stay lazy) without recording a read in the event log.
 */
export const useErrandCounts = (errandId: string): { counts: ErrandCounts; refresh: () => void } => {
  const [counts, setCounts] = useState<ErrandCounts>(EMPTY_COUNTS);

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    void getErrandCounts(errandId).then((res) => {
      if (!res.error) {
        setCounts(res.data ?? EMPTY_COUNTS);
      }
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { counts, refresh: load };
};
