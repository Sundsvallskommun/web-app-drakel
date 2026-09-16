'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { getErrand } from '@services/errand-service/errand-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandResult {
  errand?: Errand;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_ERRAND: Errand | undefined = undefined;

/** Loads a single errand (including its embedded stakeholders) by id or errand number. */
export const useErrand = (errandId: string): UseErrandResult => {
  const fetchErrand = useCallback(() => getErrand(errandId), [errandId]);
  const { data, ...query } = useServiceQuery<Errand | undefined>(fetchErrand, {
    initialData: NO_ERRAND,
    ready: !!errandId,
  });
  return { errand: data, ...query };
};
