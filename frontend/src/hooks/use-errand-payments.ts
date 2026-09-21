'use client';

import { getPayments, Payment } from '@services/payment-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandPaymentsResult {
  payments: Payment[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_PAYMENTS: Payment[] = [];

/** Loads the utbetalningar registered on an errand — both handläggare drafts and finalize-created rows. */
export const useErrandPayments = (errandId: string): UseErrandPaymentsResult => {
  const fetchPayments = useCallback(() => getPayments(errandId), [errandId]);
  const { data, ...query } = useServiceQuery<Payment[]>(fetchPayments, {
    initialData: NO_PAYMENTS,
    ready: !!errandId,
    notFoundAsEmpty: true,
  });
  return { payments: data, ...query };
};
