'use client';

import { LifecareCalculationView } from '@data-contracts/backend/data-contracts';
import { getLifecareCalculation } from '@services/lifecare-calculation-service';
import { useCallback } from 'react';

import { useServiceQuery } from './use-service-query';

interface UseLifecareCalculationResult {
  /** The errand's normberäkning as it stands in Lifecare; null while none has been saved. */
  calculation: LifecareCalculationView | null;
  isLoading: boolean;
  refresh: () => void;
}

/** The errand's normberäkning, read from Lifecare. Reading it is logged on the errand. */
export const useLifecareCalculation = (errandId: string): UseLifecareCalculationResult => {
  const fetchCalculation = useCallback(() => getLifecareCalculation(errandId), [errandId]);
  const { data, isLoading, refresh } = useServiceQuery<LifecareCalculationView | null>(fetchCalculation, {
    initialData: null,
    ready: !!errandId,
  });
  return { calculation: data, isLoading, refresh };
};
