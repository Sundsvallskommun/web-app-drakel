'use client';

import { getPayees, PayeeOption } from '@services/payment-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandPayeesResult {
  payees: PayeeOption[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_PAYEES: PayeeOption[] = [];

/**
 * The selectable betalningsmottagare for an errand. caremanagement reads Lifecare best-effort here, so
 * an outage yields the manually added rows rather than an error — an empty list is a normal state.
 */
export const useErrandPayees = (errandId: string): UseErrandPayeesResult => {
  const fetchPayees = useCallback(() => getPayees(errandId), [errandId]);
  const { data, ...query } = useServiceQuery<PayeeOption[]>(fetchPayees, {
    initialData: NO_PAYEES,
    ready: !!errandId,
    notFoundAsEmpty: true,
  });
  return { payees: data, ...query };
};
