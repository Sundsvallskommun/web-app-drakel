'use client';

import { Errand, PagingAndSortingMetaData } from '@data-contracts/backend/data-contracts';
import { ErrandsQuery, getErrands } from '@services/errand-service/errand-service';
import { useCallback, useEffect, useState } from 'react';

interface UseErrandsResult {
  errands: Errand[];
  meta: PagingAndSortingMetaData;
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
}

/**
 * Loads a paged list of errands. A light data layer over {@link getErrands} — local state only,
 * no global store. Re-fetches whenever the paging/filter inputs change.
 */
export const useErrands = (query: ErrandsQuery): UseErrandsResult => {
  const [errands, setErrands] = useState<Errand[]>([]);
  const [meta, setMeta] = useState<PagingAndSortingMetaData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const { filter, page, size, hasUnacknowledgedNotifications } = query;
  // Stable string for the dependency list. Joined with a newline — NOT a comma — because each sort entry
  // is itself "field,direction"; a comma delimiter would split the direction off into its own (invalid)
  // sort field, so the backend would always sort ascending.
  const sortKey = query.sort?.join('\n') ?? '';

  const load = useCallback(() => {
    setIsLoading(true);
    void getErrands({
      filter,
      page,
      size,
      sort: sortKey ? sortKey.split('\n') : undefined,
      hasUnacknowledgedNotifications,
    }).then((res) => {
      if (res.error) {
        setError(res.error);
        setErrands([]);
        setMeta({});
      } else {
        setError(undefined);
        setErrands(res.data?.errands ?? []);
        setMeta(res.data?._meta ?? {});
      }
      setIsLoading(false);
    });
  }, [filter, page, size, sortKey, hasUnacknowledgedNotifications]);

  useEffect(() => {
    load();
  }, [load]);

  return { errands, meta, isLoading, error, refresh: load };
};
