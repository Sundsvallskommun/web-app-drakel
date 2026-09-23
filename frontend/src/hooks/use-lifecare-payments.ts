'use client';

import { LifecareRegisteredPaymentView } from '@data-contracts/backend/data-contracts';
import { getLifecarePayments } from '@services/lifecare-payment-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseLifecarePaymentsResult {
  payments: LifecareRegisteredPaymentView[];
  isLoading: boolean;
  error?: ServiceError;
  errorMessage?: string;
  refresh: () => void;
}

const NO_PAYMENTS: LifecareRegisteredPaymentView[] = [];

/** The utbetalningar registered on the errand's insats, read live from Lifecare. Reading them is logged. */
export const useLifecarePayments = (errandId: string): UseLifecarePaymentsResult => {
  const fetchPayments = useCallback(() => getLifecarePayments(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchPayments, { initialData: NO_PAYMENTS, ready: !!errandId });
  return { payments: data, ...query };
};
