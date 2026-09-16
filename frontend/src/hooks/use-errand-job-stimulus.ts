'use client';

import { getJobStimulusPeriods, JobStimulusPeriod } from '@services/job-stimulus-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandJobStimulusResult {
  periods: JobStimulusPeriod[];
  isLoading: boolean;
  error?: ServiceError;
}

const NO_PERIODS: JobStimulusPeriod[] = [];

/** Loads the jobbstimulans periods (applicant and co-applicant) imported from Lifecare for an errand. */
export const useErrandJobStimulus = (errandId: string): UseErrandJobStimulusResult => {
  const fetchPeriods = useCallback(() => getJobStimulusPeriods(errandId), [errandId]);
  const { data, isLoading, error } = useServiceQuery(fetchPeriods, { initialData: NO_PERIODS, enabled: !!errandId });
  return { periods: data, isLoading, error };
};
