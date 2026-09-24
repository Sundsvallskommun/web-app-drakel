'use client';

import { SsbtekPaymentsView } from '@data-contracts/backend/data-contracts';
import { getSsbtekPayments } from '@services/ssbtek-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseSsbtekPaymentsResult {
  view: SsbtekPaymentsView;
  isLoading: boolean;
  error?: ServiceError;
  errorMessage?: string;
  refresh: () => void;
}

const NO_PAYMENTS: SsbtekPaymentsView = { payments: [] };

/** The payments SSBTEK reports to the errand's sökande. Each load is a live SSBTEK read, logged on the errand. */
export const useSsbtekPayments = (errandId: string): UseSsbtekPaymentsResult => {
  const fetchPayments = useCallback(() => getSsbtekPayments(errandId), [errandId]);
  const { data, isLoading, error, errorMessage, refresh } = useServiceQuery<SsbtekPaymentsView>(fetchPayments, {
    initialData: NO_PAYMENTS,
    ready: !!errandId,
  });
  return { view: data, isLoading, error, errorMessage, refresh };
};
