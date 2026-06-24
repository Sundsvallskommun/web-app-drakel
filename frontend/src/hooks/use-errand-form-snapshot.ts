'use client';

import { FormSnapshot } from '@data-contracts/backend/data-contracts';
import { getFormSnapshot } from '@services/form-snapshot-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandFormSnapshotResult {
  /** The captured snapshot, or null when none was captured for the errand. */
  snapshot: FormSnapshot | null;
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/**
 * Loads an errand's application form snapshot. `enabled` gates the fetch so it only reads when the Ansökan
 * tab is actually open. A missing snapshot is a normal state (null), not an error.
 */
export const useErrandFormSnapshot = (errandId: string, enabled = true): UseErrandFormSnapshotResult => {
  const [snapshot, setSnapshot] = useState<FormSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId || !enabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    void getFormSnapshot(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setSnapshot(null);
      } else {
        setError(undefined);
        setSnapshot(res.data ?? null);
      }
      setIsLoading(false);
    });
  }, [errandId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { snapshot, isLoading, error, refresh: load };
};
