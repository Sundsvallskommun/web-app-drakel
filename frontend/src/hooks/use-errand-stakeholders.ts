'use client';

import { Stakeholder } from '@data-contracts/backend/data-contracts';
import { getErrandStakeholders } from '@services/errand-service/errand-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandStakeholdersResult {
  stakeholders: Stakeholder[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_STAKEHOLDERS: Stakeholder[] = [];

/** Loads the stakeholders for an errand from the dedicated list endpoint. */
export const useErrandStakeholders = (errandId: string): UseErrandStakeholdersResult => {
  const fetchStakeholders = useCallback(() => getErrandStakeholders(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchStakeholders, { initialData: NO_STAKEHOLDERS, ready: !!errandId });
  return { stakeholders: data, ...query };
};
