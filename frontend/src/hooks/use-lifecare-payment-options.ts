'use client';

import { LifecarePaymentOptionsView } from '@data-contracts/backend/data-contracts';
import { getLifecarePaymentOptions } from '@services/lifecare-payment-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseLifecarePaymentOptionsResult {
  options: LifecarePaymentOptionsView;
  isLoading: boolean;
  error?: ServiceError;
  /** Lifecare's own reason when it would not hand the options over. */
  errorMessage?: string;
  refresh: () => void;
}

const NO_OPTIONS: LifecarePaymentOptionsView = {
  paymentMethods: [],
  payees: [],
  postings: [],
  balances: [],
  concernMonths: [],
  proposal: {},
};

/**
 * Everything the utbetalning form needs, read live from Lifecare: betalsätt, betalningsmottagare,
 * ändamål (konteringsrader), saldon, the months it may concern and the proposal it starts from. Reading
 * it is logged on the errand.
 */
export const useLifecarePaymentOptions = (errandId: string): UseLifecarePaymentOptionsResult => {
  const fetchOptions = useCallback(() => getLifecarePaymentOptions(errandId), [errandId]);
  const { data, ...query } = useServiceQuery<LifecarePaymentOptionsView>(fetchOptions, {
    initialData: NO_OPTIONS,
    ready: !!errandId,
  });
  return { options: data, ...query };
};
