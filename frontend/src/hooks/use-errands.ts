'use client';

import { Errand, FindErrandsResult, PagingAndSortingMetaData } from '@data-contracts/backend/data-contracts';
import { ErrandsQuery, getErrands } from '@services/errand-service/errand-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandsResult {
  errands: Errand[];
  meta: PagingAndSortingMetaData;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_RESULT: FindErrandsResult = {};
const NO_ERRANDS: Errand[] = [];
const NO_META: PagingAndSortingMetaData = {};

/**
 * Loads a paged list of errands. A light data layer over {@link getErrands} — local state only,
 * no global store. Re-fetches whenever the paging/filter inputs change.
 */
export const useErrands = (query: ErrandsQuery): UseErrandsResult => {
  const { filter, page, size, hasUnacknowledgedNotifications } = query;
  // Stable string for the dependency list. Joined with a newline — NOT a comma — because each sort entry
  // is itself "field,direction"; a comma delimiter would split the direction off into its own (invalid)
  // sort field, so the backend would always sort ascending.
  const sortKey = query.sort?.join('\n') ?? '';

  const fetchErrands = useCallback(
    () =>
      getErrands({
        filter,
        page,
        size,
        sort: sortKey ? sortKey.split('\n') : undefined,
        hasUnacknowledgedNotifications,
      }),
    [filter, page, size, sortKey, hasUnacknowledgedNotifications]
  );
  const { data, ...result } = useServiceQuery(fetchErrands, { initialData: NO_RESULT });
  return { errands: data.errands ?? NO_ERRANDS, meta: data._meta ?? NO_META, ...result };
};
