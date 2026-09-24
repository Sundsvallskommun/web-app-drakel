'use client';

import { LifecareHouseholdView } from '@data-contracts/backend/data-contracts';
import { getLifecareHousehold } from '@services/lifecare-household-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseLifecareHouseholdResult {
  household: LifecareHouseholdView;
  isLoading: boolean;
  error?: ServiceError;
  errorMessage?: string;
  refresh: () => void;
}

const NO_HOUSEHOLD: LifecareHouseholdView = { persons: [] };

/** The sökandes hushåll in Lifecare, for an errand whose normberäkning is saved there. */
export const useLifecareHousehold = (errandId: string): UseLifecareHouseholdResult => {
  const fetchHousehold = useCallback(() => getLifecareHousehold(errandId), [errandId]);
  const { data, ...query } = useServiceQuery<LifecareHouseholdView>(fetchHousehold, {
    initialData: NO_HOUSEHOLD,
    ready: !!errandId,
  });
  return { household: data, ...query };
};
