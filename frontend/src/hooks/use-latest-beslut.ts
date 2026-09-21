'use client';

import { Decision, getLatestBeslut } from '@services/beslut-service';
import { useCallback } from 'react';

import { useServiceQuery } from './use-service-query';

const NO_BESLUT: Decision | null = null;

/**
 * The handläggare's latest saved beslut. A thin read for views that only need the decided amount —
 * {@link useErrandBeslut} also loads the options and the recommendation, which the Utbetalning tab
 * has no use for.
 */
export const useLatestBeslut = (errandId: string): Decision | null => {
  const fetchBeslut = useCallback(() => getLatestBeslut(errandId), [errandId]);
  const { data } = useServiceQuery<Decision | null>(fetchBeslut, {
    initialData: NO_BESLUT,
    ready: !!errandId,
    notFoundAsEmpty: true,
  });
  return data;
};
