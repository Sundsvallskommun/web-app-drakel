'use client';

import { LifecareDecisionView } from '@data-contracts/backend/data-contracts';
import { getLifecareDecision } from '@services/lifecare-decision-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseLifecareDecisionResult {
  /** The errand's beslut as it stands in Lifecare; null while none has been saved. */
  decision: LifecareDecisionView | null;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

/** The errand's beslut, read from Lifecare — the Beslut tab's saved state. Reading it is logged on the errand. */
export const useLifecareDecision = (errandId: string): UseLifecareDecisionResult => {
  const fetchDecision = useCallback(() => getLifecareDecision(errandId), [errandId]);
  const { data, isLoading, error, refresh } = useServiceQuery<LifecareDecisionView | null>(fetchDecision, {
    initialData: null,
    ready: !!errandId,
  });
  return { decision: data, isLoading, error, refresh };
};
