'use client';

import { ServiceResponse } from '@interfaces/services';
import { useCallback, useEffect, useRef, useState } from 'react';

export type ServiceError = ServiceResponse['error'];

interface ServiceQueryOptions<T> {
  /** The data before anything has loaded and after an error. Pass a stable value (e.g. a module constant). */
  initialData: T;
  /**
   * False while an input the fetch depends on isn't resolved yet (e.g. the errand id): nothing is fetched and
   * the query keeps reporting that it's loading.
   */
  ready?: boolean;
  /**
   * False to not fetch at all (e.g. a lazy section that isn't open): the query is idle and doesn't report
   * loading.
   */
  enabled?: boolean;
  /** Treat a 404 as "nothing yet" (the initial data, no error) rather than as a failure. */
  notFoundAsEmpty?: boolean;
  /** Transforms successfully loaded data, e.g. sorting it. */
  select?: (data: T) => T;
}

interface ServiceQueryResult<T> {
  data: T;
  isLoading: boolean;
  error?: ServiceError;
  /** Fetches again with the same inputs. */
  refresh: () => void;
}

const NOT_FOUND = 404;

/**
 * Loads data through a service function and tracks loading and error state. Refetches when `fetcher` changes,
 * so wrap it in `useCallback` with its inputs as dependencies. A response that resolves after its inputs changed
 * (or after unmount) is ignored, so an older response can never overwrite newer data.
 */
export const useServiceQuery = <T>(
  fetcher: () => Promise<ServiceResponse<T>>,
  { initialData, ready = true, enabled = true, notFoundAsEmpty = false, select }: ServiceQueryOptions<T>
): ServiceQueryResult<T> => {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ServiceError>();
  // Bumped by refresh() to re-run the fetch effect with unchanged inputs.
  const [reloadToken, setReloadToken] = useState<number>(0);

  // Kept in a ref so a new `select` function or `initialData` literal on each render doesn't trigger a refetch.
  const dataOptionsRef = useRef({ initialData, select });
  useEffect(() => {
    dataOptionsRef.current = { initialData, select };
  }, [initialData, select]);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    if (!ready) {
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    void fetcher().then((response) => {
      if (cancelled) {
        return;
      }
      const { initialData: emptyData, select: transform } = dataOptionsRef.current;
      if (response.error && !(notFoundAsEmpty && response.error === NOT_FOUND)) {
        setError(response.error);
        setData(emptyData);
      } else {
        setError(undefined);
        const loaded = response.error ? emptyData : (response.data ?? emptyData);
        setData(transform ? transform(loaded) : loaded);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [fetcher, ready, enabled, notFoundAsEmpty, reloadToken]);

  const refresh = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return { data, isLoading, error, refresh };
};
