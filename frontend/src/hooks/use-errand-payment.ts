'use client';

import { getPaymentStatus, PaymentStatus } from '@services/payment-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandPaymentResult {
  status?: PaymentStatus;
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads the Lifecare utbetalning status for an errand. */
export const useErrandPayment = (errandId: string): UseErrandPaymentResult => {
  const [status, setStatus] = useState<PaymentStatus>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    void getPaymentStatus(errandId).then((res) => {
      if (res.error) {
        setError(res.error);
        setStatus(undefined);
      } else {
        setError(undefined);
        setStatus(res.data ?? undefined);
      }
      setIsLoading(false);
    });
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { status, isLoading, error, refresh: load };
};
