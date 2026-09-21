'use client';

import { getPaymentProposal, PaymentProposal } from '@services/payment-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UsePaymentProposalResult {
  proposal: PaymentProposal;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_PROPOSAL: PaymentProposal = {};

/**
 * Loads the utbetalningsförslag for an errand. caremanagement recomputes it on every read, so there is
 * nothing to cache — refetching is how the form picks up a changed normberäkning.
 */
export const usePaymentProposal = (errandId: string): UsePaymentProposalResult => {
  const fetchProposal = useCallback(() => getPaymentProposal(errandId), [errandId]);
  const { data, ...query } = useServiceQuery<PaymentProposal>(fetchProposal, {
    initialData: NO_PROPOSAL,
    ready: !!errandId,
    notFoundAsEmpty: true,
  });
  return { proposal: data, ...query };
};
