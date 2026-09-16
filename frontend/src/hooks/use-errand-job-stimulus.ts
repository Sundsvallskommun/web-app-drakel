'use client';

import { getJobStimulusPeriods, JobStimulusPeriod } from '@services/job-stimulus-service';
import { useEffect, useState } from 'react';

interface UseErrandJobStimulusResult {
  periods: JobStimulusPeriod[];
  isLoading: boolean;
  error?: number | string | boolean;
}

/** Loads the jobbstimulans periods (applicant and co-applicant) imported from Lifecare for an errand. */
export const useErrandJobStimulus = (errandId: string): UseErrandJobStimulusResult => {
  const [periods, setPeriods] = useState<JobStimulusPeriod[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  useEffect(() => {
    if (!errandId) {
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    void getJobStimulusPeriods(errandId).then((res) => {
      if (!active) return;
      setError(res.error);
      setPeriods(res.error ? [] : (res.data ?? []));
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [errandId]);

  return { periods, isLoading, error };
};
