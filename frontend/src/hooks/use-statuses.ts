'use client';

import { Lookup } from '@data-contracts/backend/data-contracts';
import { getStatuses } from '@services/metadata-service/metadata-service';
import { useEffect, useState } from 'react';

/** Loads the STATUS metadata lookups used by the overview status filter. */
export const useStatuses = (): { statuses: Lookup[]; isLoading: boolean } => {
  const [statuses, setStatuses] = useState<Lookup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    getStatuses().then((res) => {
      if (!active) {
        return;
      }
      setStatuses(res.error ? [] : res.data ?? []);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { statuses, isLoading };
};
