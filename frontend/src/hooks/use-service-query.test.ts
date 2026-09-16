import { ServiceResponse } from '@interfaces/services';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useServiceQuery } from './use-service-query';

const EMPTY: string[] = [];

describe('useServiceQuery', () => {
  it('loads data and stops loading', async () => {
    const fetcher = vi.fn(() => Promise.resolve<ServiceResponse<string[]>>({ data: ['a'] }));
    const { result } = renderHook(() => useServiceQuery(fetcher, { initialData: EMPTY }));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.data).toEqual(['a']);
    expect(result.current.error).toBeUndefined();
  });

  it('reports errors and falls back to the initial data', async () => {
    const fetcher = vi.fn(() => Promise.resolve<ServiceResponse<string[]>>({ error: 500 }));
    const { result } = renderHook(() => useServiceQuery(fetcher, { initialData: EMPTY }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).toBe(500);
    expect(result.current.data).toBe(EMPTY);
  });

  it('treats a 404 as empty when notFoundAsEmpty is set', async () => {
    const fetcher = vi.fn(() => Promise.resolve<ServiceResponse<string[]>>({ error: 404 }));
    const { result } = renderHook(() => useServiceQuery(fetcher, { initialData: EMPTY, notFoundAsEmpty: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toBe(EMPTY);
  });

  it('keeps loading without fetching until ready, and is idle when disabled', async () => {
    const fetcher = vi.fn(() => Promise.resolve<ServiceResponse<string[]>>({ data: ['a'] }));
    const notReady = renderHook(() => useServiceQuery(fetcher, { initialData: EMPTY, ready: false }));
    const disabled = renderHook(() => useServiceQuery(fetcher, { initialData: EMPTY, enabled: false }));

    await waitFor(() => {
      expect(disabled.result.current.isLoading).toBe(false);
    });
    expect(notReady.result.current.isLoading).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('applies select and refetches on refresh', async () => {
    let call = 0;
    const fetcher = vi.fn(() => Promise.resolve<ServiceResponse<string[]>>({ data: [`b${++call}`, 'a'] }));
    const sortAscending = (items: string[]) => [...items].sort();
    const { result } = renderHook(() => useServiceQuery(fetcher, { initialData: EMPTY, select: sortAscending }));

    await waitFor(() => {
      expect(result.current.data).toEqual(['a', 'b1']);
    });
    act(() => {
      result.current.refresh();
    });
    await waitFor(() => {
      expect(result.current.data).toEqual(['a', 'b2']);
    });
  });

  it('ignores a response that resolves after the fetcher changed', async () => {
    let resolveSlow: (value: ServiceResponse<string[]>) => void = () => undefined;
    const slowFetcher = () =>
      new Promise<ServiceResponse<string[]>>((resolve) => {
        resolveSlow = resolve;
      });
    const fastFetcher = () => Promise.resolve<ServiceResponse<string[]>>({ data: ['new'] });

    const { result, rerender } = renderHook(({ fetcher }) => useServiceQuery(fetcher, { initialData: EMPTY }), {
      initialProps: { fetcher: slowFetcher },
    });
    rerender({ fetcher: fastFetcher });
    await waitFor(() => {
      expect(result.current.data).toEqual(['new']);
    });
    await act(async () => {
      resolveSlow({ data: ['old'] });
      await Promise.resolve();
    });
    expect(result.current.data).toEqual(['new']);
  });
});
