'use client';

import { ErrandCounts } from '@data-contracts/backend/data-contracts';
import { getErrandCounts } from '@services/counts-service';
import { useCallback } from 'react';

import { useServiceQuery } from './use-service-query';

const EMPTY_COUNTS: ErrandCounts = { notes: 0, warnings: 0, unreadMessages: 0 };

/**
 * Loads an errand's sidebar badge counts. The underlying endpoints are unlogged, so these load eagerly
 * with the errand (the lists themselves stay lazy) without recording a read in the event log. A failed load
 * shows no counts rather than an error — the badges are a convenience.
 */
export const useErrandCounts = (errandId: string): { counts: ErrandCounts; refresh: () => void } => {
  const fetchCounts = useCallback(() => getErrandCounts(errandId), [errandId]);
  const { data, refresh } = useServiceQuery(fetchCounts, { initialData: EMPTY_COUNTS, enabled: !!errandId });
  return { counts: data, refresh };
};
