'use client';

import { Administrator } from '@data-contracts/backend/data-contracts';
import { getAdministrators } from '@services/administrator-service';

import { useServiceQuery } from './use-service-query';

const NO_ADMINISTRATORS: Administrator[] = [];

/** Loads the handläggare roster (AD users) for the assignee picker and the overview filter. */
export const useAdministrators = (): { administrators: Administrator[]; isLoading: boolean } => {
  const { data, isLoading } = useServiceQuery(getAdministrators, { initialData: NO_ADMINISTRATORS });
  return { administrators: data, isLoading };
};
