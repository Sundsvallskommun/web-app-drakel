'use client';

import { SsbtekPaymentsView } from '@data-contracts/backend/data-contracts';
import { getSsbtekPayments } from '@services/ssbtek-service';
import { SsbtekPeriod } from '@utils/ssbtek-period';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseSsbtekPaymentsResult {
  view: SsbtekPaymentsView;
  isLoading: boolean;
  error?: ServiceError;
  errorMessage?: string;
  refresh: () => void;
}

const NO_PAYMENTS: SsbtekPaymentsView = {
  payments: [],
  hasCoApplicant: false,
  coApplicantUnavailable: false,
  hasChildren: false,
  unavailableChildren: [],
};

/**
 * The payments SSBTEK reports to the errand's sökande, any medsökande and children in the period (careM's default
 * without one). Each load is a live SSBTEK read, logged on the errand.
 */
export const useSsbtekPayments = (errandId: string, period?: SsbtekPeriod): UseSsbtekPaymentsResult => {
  const from = period?.from;
  const to = period?.to;
  const fetchPayments = useCallback(
    () => getSsbtekPayments(errandId, from && to ? { from, to } : undefined),
    [errandId, from, to]
  );
  const { data, isLoading, error, errorMessage, refresh } = useServiceQuery<SsbtekPaymentsView>(fetchPayments, {
    initialData: NO_PAYMENTS,
    ready: !!errandId,
  });
  return { view: data, isLoading, error, errorMessage, refresh };
};
