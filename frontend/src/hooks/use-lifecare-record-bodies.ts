'use client';

import { LifecareRecordBodyView } from '@data-contracts/backend/data-contracts';
import { getLifecareRecordBodies, LifecareRecordCategory } from '@services/lifecare-documents-service';
import { useCallback, useMemo } from 'react';

import { useServiceQuery } from './use-service-query';

interface UseLifecareRecordBodiesResult {
  /** Each record's body by record id; a record missing here has not been read (yet). */
  bodyById: ReadonlyMap<string, LifecareRecordBodyView>;
  isLoading: boolean;
  /** True when the bodies could not be read at all. */
  failed: boolean;
  refresh: () => void;
}

const NO_BODIES: LifecareRecordBodyView[] = [];

/**
 * The text of every journalanteckning or document on the errand's Lifecare record, read so the tab can
 * show and search it without opening each record. Reading them is logged on the errand.
 */
export const useLifecareRecordBodies = (
  errandId: string,
  category: LifecareRecordCategory
): UseLifecareRecordBodiesResult => {
  const fetchBodies = useCallback(() => getLifecareRecordBodies(errandId, category), [errandId, category]);
  const { data, isLoading, error, refresh } = useServiceQuery(fetchBodies, {
    initialData: NO_BODIES,
    ready: !!errandId,
  });
  const bodyById = useMemo(() => new Map(data.map((body) => [body.id, body])), [data]);
  return { bodyById, isLoading, failed: !!error, refresh };
};
