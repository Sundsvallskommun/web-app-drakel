'use client';

import { DecisionPhrase } from '@data-contracts/backend/data-contracts';
import { getDecisionPhrases } from '@services/decision-phrase-service';

import { useServiceQuery } from './use-service-query';

interface UseDecisionPhrasesResult {
  phrases: DecisionPhrase[];
  isLoading: boolean;
}

const NO_PHRASES: DecisionPhrase[] = [];

/** The beslutsformuleringar from Templating, as the admin page keeps them. */
export const useDecisionPhrases = (): UseDecisionPhrasesResult => {
  const { data, isLoading } = useServiceQuery(getDecisionPhrases, { initialData: NO_PHRASES });
  return { phrases: data, isLoading };
};
