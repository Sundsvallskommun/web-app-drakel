'use client';

import { Bevakning, getBevakningar } from '@services/bevakning-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandBevakningarResult {
  bevakningar: Bevakning[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_BEVAKNINGAR: Bevakning[] = [];

/**
 * Loads the bevakningar (date-bound watches/reminders) for an errand. `enabled` gates the fetch so the
 * list is only read when the Bevakningar sidebar section is opened (not on every errand open).
 */
export const useErrandBevakningar = (errandId: string, enabled = true): UseErrandBevakningarResult => {
  const fetchBevakningar = useCallback(() => getBevakningar(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchBevakningar, {
    initialData: NO_BEVAKNINGAR,
    enabled: enabled && !!errandId,
  });
  return { bevakningar: data, ...query };
};
