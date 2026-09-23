'use client';

import { LifecareDecisionReasonView } from '@data-contracts/backend/data-contracts';
import { getLifecareDecisionReasons } from '@services/lifecare-decision-service';
import { useCallback } from 'react';

import { useServiceQuery } from './use-service-query';

interface UseLifecareDecisionReasonsResult {
  reasons: LifecareDecisionReasonView[];
  isLoading: boolean;
}

const NO_REASONS: LifecareDecisionReasonView[] = [];

/** The orsaker Lifecare offers for a beslutstyp, read again whenever the type changes; none without a type. */
export const useLifecareDecisionReasons = (decisionCode: number | undefined): UseLifecareDecisionReasonsResult => {
  const fetchReasons = useCallback(() => getLifecareDecisionReasons(decisionCode ?? 0), [decisionCode]);
  const { data, isLoading } = useServiceQuery(fetchReasons, {
    initialData: NO_REASONS,
    enabled: decisionCode !== undefined,
  });
  return { reasons: decisionCode === undefined ? NO_REASONS : data, isLoading };
};
