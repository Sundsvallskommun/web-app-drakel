'use client';

import { PaymentStatusView } from '@data-contracts/backend/data-contracts';
import { getPaymentStatus } from '@services/payment-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandPaymentResult {
  status?: PaymentStatusView;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_STATUS: PaymentStatusView | undefined = undefined;

/** Loads the Lifecare utbetalning status for an errand. */
export const useErrandPayment = (errandId: string): UseErrandPaymentResult => {
  const fetchStatus = useCallback(() => getPaymentStatus(errandId), [errandId]);
  const { data, ...query } = useServiceQuery<PaymentStatusView | undefined>(fetchStatus, {
    initialData: NO_STATUS,
    ready: !!errandId,
  });
  return { status: data, ...query };
};
