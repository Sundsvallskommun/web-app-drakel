'use client';

import { Lookup } from '@data-contracts/backend/data-contracts';
import { getErrandTypes } from '@services/metadata-service/metadata-service';

import { useServiceQuery } from './use-service-query';

const NO_TYPES: Lookup[] = [];

/** Loads the errand types used by the overview's type filter. */
export const useErrandTypes = (): { errandTypes: Lookup[]; isLoading: boolean } => {
  const { data, isLoading } = useServiceQuery(getErrandTypes, { initialData: NO_TYPES });
  return { errandTypes: data, isLoading };
};
