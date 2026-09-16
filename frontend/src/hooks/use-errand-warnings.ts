'use client';

import { getWarnings, Warning } from '@services/warning-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandWarningsResult {
  warnings: Warning[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_WARNINGS: Warning[] = [];

const timestamp = (warning: Warning): number => new Date(warning.created ?? warning.updated ?? 0).getTime();
const newestFirst = (warnings: Warning[]): Warning[] => [...warnings].sort((a, b) => timestamp(b) - timestamp(a));

/**
 * Loads an errand's EB income warnings (newest first). `enabled` gates the fetch so warnings are only read when
 * the Varningar sidebar section or the Normberäkning tab is opened (not on every errand open).
 */
export const useErrandWarnings = (errandId: string, enabled = true): UseErrandWarningsResult => {
  const fetchWarnings = useCallback(() => getWarnings(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchWarnings, {
    initialData: NO_WARNINGS,
    enabled: enabled && !!errandId,
    select: newestFirst,
  });
  return { warnings: data, ...query };
};
