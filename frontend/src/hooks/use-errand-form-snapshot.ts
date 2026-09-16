'use client';

import { FormSnapshot } from '@data-contracts/backend/data-contracts';
import { getFormSnapshot } from '@services/form-snapshot-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandFormSnapshotResult {
  /** The captured snapshot, or null when none was captured for the errand. */
  snapshot: FormSnapshot | null;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_SNAPSHOT: FormSnapshot | null = null;

/**
 * Loads an errand's application form snapshot. `enabled` gates the fetch so it only reads when the Ansökan
 * tab is actually open. A missing snapshot is a normal state (null), not an error.
 */
export const useErrandFormSnapshot = (errandId: string, enabled = true): UseErrandFormSnapshotResult => {
  const fetchSnapshot = useCallback(() => getFormSnapshot(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchSnapshot, {
    initialData: NO_SNAPSHOT,
    enabled: enabled && !!errandId,
  });
  return { snapshot: data, ...query };
};
