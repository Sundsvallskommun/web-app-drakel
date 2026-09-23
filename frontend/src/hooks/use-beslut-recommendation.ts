'use client';

import { Decision, getBeslutRecommendation } from '@services/beslut-service';
import { useCallback } from 'react';

import { useServiceQuery } from './use-service-query';

interface UseBeslutRecommendationResult {
  /** The latest automated recommendation, null when none exists. */
  recommendation: Decision | null;
  isLoading: boolean;
}

/**
 * The automated beslut recommendation careM made for the errand — one of the starting points for a beslut
 * not yet saved in Lifecare. A 404 (none produced yet) is a normal state.
 */
export const useBeslutRecommendation = (errandId: string): UseBeslutRecommendationResult => {
  const fetchRecommendation = useCallback(() => getBeslutRecommendation(errandId), [errandId]);
  const { data, isLoading } = useServiceQuery<Decision | null>(fetchRecommendation, {
    initialData: null,
    ready: !!errandId,
    notFoundAsEmpty: true,
  });
  return { recommendation: data, isLoading };
};
