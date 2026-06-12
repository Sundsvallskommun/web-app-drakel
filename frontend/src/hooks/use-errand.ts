'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { getErrand } from '@services/errand-service/errand-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandResult {
  errand?: Errand;
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads a single errand (including its embedded stakeholders) by id. */
export const useErrand = (errandId: string): UseErrandResult => {
  const [errand, setErrand] = useState<Errand>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    getErrand(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setErrand(undefined);
      } else {
        setError(undefined);
        setErrand(res.data);
      }
      setIsLoading(false);
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { errand, isLoading, error, refresh: load };
};
