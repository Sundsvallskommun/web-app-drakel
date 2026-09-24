'use client';

import { LifecareSectionStatusView } from '@data-contracts/backend/data-contracts';
import { getLifecareSectionStatus } from '@services/lifecare-section-status-service';
import { useCallback } from 'react';

import { useServiceQuery } from './use-service-query';

interface UseLifecareSectionStatusResult {
  status: LifecareSectionStatusView;
  refresh: () => void;
}

const NOTHING_DONE: LifecareSectionStatusView = {
  calculationFinalized: false,
  decisionSaved: false,
  paymentRegistered: false,
};

/**
 * The checks on the Normberäkning, Beslut and Utbetalning tabs, from their state in Lifecare. Read with the
 * errand (when `enabled`) so the checks show as it opens; nothing is shown as done until Lifecare says so.
 */
export const useLifecareSectionStatus = (errandId: string, enabled: boolean): UseLifecareSectionStatusResult => {
  const fetchStatus = useCallback(() => getLifecareSectionStatus(errandId), [errandId]);
  const { data, refresh } = useServiceQuery<LifecareSectionStatusView>(fetchStatus, {
    initialData: NOTHING_DONE,
    ready: !!errandId,
    enabled,
  });
  return { status: data, refresh };
};
