'use client';

import { FinancialAssistanceData } from '@interfaces/financial-assistance';
import { getApplicationData } from '@services/errand-service/errand-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandApplicationDataResult {
  /** What the citizen submitted, or null for an errand without financial-assistance data. */
  data: FinancialAssistanceData | null;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_DATA: FinancialAssistanceData | null = null;

/** Loads the financial-assistance application data the citizen submitted for an errand. */
export const useErrandApplicationData = (errandId: string): UseErrandApplicationDataResult => {
  const fetchData = useCallback(() => getApplicationData(errandId), [errandId]);
  return useServiceQuery(fetchData, { initialData: NO_DATA, ready: !!errandId });
};
