'use client';

import { Lookup } from '@data-contracts/backend/data-contracts';
import { getStatuses } from '@services/metadata-service/metadata-service';

import { useServiceQuery } from './use-service-query';

const NO_STATUSES: Lookup[] = [];

/** Loads the STATUS metadata lookups used by the overview status filter. */
export const useStatuses = (): { statuses: Lookup[]; isLoading: boolean } => {
  const { data, isLoading } = useServiceQuery(getStatuses, { initialData: NO_STATUSES });
  return { statuses: data, isLoading };
};
