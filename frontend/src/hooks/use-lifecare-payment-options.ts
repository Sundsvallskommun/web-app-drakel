'use client';

import { LifecarePaymentOptionsView } from '@data-contracts/backend/data-contracts';
import { getLifecarePaymentOptions } from '@services/lifecare-payment-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseLifecarePaymentOptionsResult {
  options: LifecarePaymentOptionsView;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_OPTIONS: LifecarePaymentOptionsView = { paymentMethods: [], payees: [] };

/**
 * The betalsätt and betalningsmottagare an utbetalning on the errand can use, read live from Lifecare —
 * the register of record for both. Reading it is logged on the errand.
 */
export const useLifecarePaymentOptions = (errandId: string): UseLifecarePaymentOptionsResult => {
  const fetchOptions = useCallback(() => getLifecarePaymentOptions(errandId), [errandId]);
  const { data, ...query } = useServiceQuery<LifecarePaymentOptionsView>(fetchOptions, {
    initialData: NO_OPTIONS,
    ready: !!errandId,
  });
  return { options: data, ...query };
};
