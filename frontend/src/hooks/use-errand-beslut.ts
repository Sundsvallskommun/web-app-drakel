'use client';

import { BeslutOption, Decision, getBeslutOptions, getBeslutRecommendation } from '@services/beslut-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandBeslutResult {
  options: BeslutOption[];
  /** The latest automated recommendation, null when none exists. */
  recommendation: Decision | null;
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/** Loads the beslutsalternativ and the automated recommendation used to prefill the Beslut form. */
export const useErrandBeslut = (errandId: string): UseErrandBeslutResult => {
  const [options, setOptions] = useState<BeslutOption[]>([]);
  const [recommendation, setRecommendation] = useState<Decision | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    if (!errandId) {
      return;
    }
    setIsLoading(true);
    void Promise.all([getBeslutOptions(errandId), getBeslutRecommendation(errandId)]).then(
      ([optionsResult, recommendationResult]) => {
        if (optionsResult.error) {
          setError(optionsResult.error);
        } else {
          setOptions(optionsResult.data ?? []);
        }
        // A 404 means no recommendation has been produced yet — a normal state, not an error.
        if (recommendationResult.error && recommendationResult.error !== 404) {
          setError(recommendationResult.error);
        } else {
          setRecommendation(recommendationResult.data ?? null);
        }
        setIsLoading(false);
      }
    );
  }, [errandId]);

  useEffect(() => {
    load();
  }, [load]);

  return { options, recommendation, isLoading, error, refresh: load };
};
