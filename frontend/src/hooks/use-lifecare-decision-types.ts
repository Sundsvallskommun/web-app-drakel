'use client';

import { LifecareDecisionTypeView } from '@data-contracts/backend/data-contracts';
import { getLifecareDecisionTypes } from '@services/lifecare-decision-service';
import { useCallback } from 'react';

import { useServiceQuery } from './use-service-query';

interface UseLifecareDecisionTypesResult {
  types: LifecareDecisionTypeView[];
  isLoading: boolean;
  /** Lifecare's own reason when it would not hand the beslutstyper over. */
  errorMessage?: string;
}

const NO_TYPES: LifecareDecisionTypeView[] = [];

/** The beslutstyper the errand's insats offers in Lifecare — the Beslut tab's choices. */
export const useLifecareDecisionTypes = (errandId: string): UseLifecareDecisionTypesResult => {
  const fetchTypes = useCallback(() => getLifecareDecisionTypes(errandId), [errandId]);
  const { data, isLoading, errorMessage } = useServiceQuery(fetchTypes, { initialData: NO_TYPES, ready: !!errandId });
  return { types: data, isLoading, errorMessage };
};
