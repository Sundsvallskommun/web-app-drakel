import { beforeEach, describe, expect, it } from 'vitest';

import { useOverviewFilterStore } from './overview-filter-store';

const STORAGE_KEY = 'drakel-overview-filter';

describe('useOverviewFilterStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps the search in memory but never writes it to localStorage', () => {
    useOverviewFilterStore.getState().setQuery('19121212-1212');
    useOverviewFilterStore.getState().setPageSize(24);

    expect(useOverviewFilterStore.getState().query).toBe('19121212-1212');
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? '';
    expect(stored).toContain('"pageSize":24');
    expect(stored).not.toContain('19121212-1212');
    expect(stored).not.toContain('"query"');
  });

  it('drops a search term an older version stored', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ state: { selectedView: 'ongoing', query: 'Ann Andersson' }, version: 5 })
    );
    useOverviewFilterStore.setState({ query: '' });

    await useOverviewFilterStore.persist.rehydrate();

    expect(useOverviewFilterStore.getState().query).toBe('');
    expect(window.localStorage.getItem(STORAGE_KEY)).not.toContain('Ann Andersson');
  });
});
