'use client';

import { DecisionProposal, getDecisionProposal } from '@services/beslut-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseDecisionProposalResult {
  proposal: DecisionProposal;
  isLoading: boolean;
  error?: ServiceError;
}

const NO_PROPOSAL: DecisionProposal = {};

/**
 * Loads the beslutsförslag for an errand. caremanagement recomputes it on every read, so there is
 * nothing to cache — and a 404 (no calculation to base a proposal on yet) is a normal state.
 */
export const useDecisionProposal = (errandId: string): UseDecisionProposalResult => {
  const fetchProposal = useCallback(() => getDecisionProposal(errandId), [errandId]);
  const { data, isLoading, error } = useServiceQuery<DecisionProposal>(fetchProposal, {
    initialData: NO_PROPOSAL,
    ready: !!errandId,
    notFoundAsEmpty: true,
  });
  return { proposal: data, isLoading, error };
};
