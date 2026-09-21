'use client';

import { getPaymentMetadata, PaymentMetadata } from '@services/payment-service';
import { useCallback } from 'react';

import { useServiceQuery } from './use-service-query';

const NO_METADATA: PaymentMetadata = { paymentMethods: [] };

/**
 * The Lifecare catalogue behind the utbetalning form's Betalsätt dropdown. caremanagement documents it
 * as a placeholder until the real Lifecare catalogue is known, so an empty list is a normal state
 * rather than an error — the form falls back on the betalsätt the applicant's own payees use.
 */
export const usePaymentMetadata = (): PaymentMetadata => {
  const fetchMetadata = useCallback(() => getPaymentMetadata(), []);
  const { data } = useServiceQuery<PaymentMetadata>(fetchMetadata, { initialData: NO_METADATA });
  return data;
};
