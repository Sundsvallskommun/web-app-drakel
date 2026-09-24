'use client';

import { getJobStimulusPeriods, JobStimulusPeriod } from '@services/job-stimulus-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandJobStimulusResult {
  periods: JobStimulusPeriod[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_PERIODS: JobStimulusPeriod[] = [];

/** Loads the jobbstimulans periods (sökande and medsökande) on the errand's insats, read from Lifecare. */
export const useErrandJobStimulus = (errandId: string): UseErrandJobStimulusResult => {
  const fetchPeriods = useCallback(() => getJobStimulusPeriods(errandId), [errandId]);
  const { data, isLoading, error, refresh } = useServiceQuery(fetchPeriods, {
    initialData: NO_PERIODS,
    enabled: !!errandId,
  });
  return { periods: data, isLoading, error, refresh };
};
