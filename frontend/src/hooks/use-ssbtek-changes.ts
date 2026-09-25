'use client';

import { SsbtekChangesView } from '@data-contracts/backend/data-contracts';
import { getSsbtekChanges } from '@services/ssbtek-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseSsbtekChangesResult {
  view: SsbtekChangesView;
  isLoading: boolean;
  error?: ServiceError;
  errorMessage?: string;
  refresh: () => void;
}

const NOTHING_TO_TRANSFER: SsbtekChangesView = { available: false, isFinal: false, changes: [] };

/** What SSBTEK and the errand's normberäkning in Lifecare disagree on — the incomes that can be transferred. */
export const useSsbtekChanges = (errandId: string): UseSsbtekChangesResult => {
  const fetchChanges = useCallback(() => getSsbtekChanges(errandId), [errandId]);
  const { data, isLoading, error, errorMessage, refresh } = useServiceQuery<SsbtekChangesView>(fetchChanges, {
    initialData: NOTHING_TO_TRANSFER,
    ready: !!errandId,
  });
  return { view: data, isLoading, error, errorMessage, refresh };
};
