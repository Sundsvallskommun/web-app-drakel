'use client';

import { Stakeholder } from '@data-contracts/backend/data-contracts';
import { getErrandStakeholders } from '@services/errand-service/errand-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandStakeholdersResult {
  stakeholders: Stakeholder[];
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads the stakeholders for an errand from the dedicated list endpoint. */
export const useErrandStakeholders = (errandId: string): UseErrandStakeholdersResult => {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    getErrandStakeholders(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setStakeholders([]);
      } else {
        setError(undefined);
        setStakeholders(res.data ?? []);
      }
      setIsLoading(false);
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { stakeholders, isLoading, error, refresh: load };
};
