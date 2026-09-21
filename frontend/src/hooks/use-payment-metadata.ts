'use client';

import { getPaymentMetadata, PaymentMetadata } from '@services/payment-service';
import { useCallback } from 'react';

import { useServiceQuery } from './use-service-query';

const NO_METADATA: PaymentMetadata = { moneyTypes: [], paymentMethods: [] };

/**
 * The Lifecare catalogues behind the utbetalning form's Pengar and Betalsätt dropdowns. Both are
 * documented as placeholders in caremanagement until the real Lifecare catalogue is known, so an empty
 * list is a normal state rather than an error.
 */
export const usePaymentMetadata = (): PaymentMetadata => {
  const fetchMetadata = useCallback(() => getPaymentMetadata(), []);
  const { data } = useServiceQuery<PaymentMetadata>(fetchMetadata, { initialData: NO_METADATA });
  return data;
};
