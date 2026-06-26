import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ErrandView } from './errand-views';
import { emptyFilters, ErrandFilters } from './errands-filter.component';
import { SortDirection } from './errands-table.component';

export interface OverviewSort {
  column: string;
  direction: SortDirection;
}

interface OverviewFilterState {
  selectedView: ErrandView;
  /** The committed free-text search. */
  query: string;
  filters: ErrandFilters;
  sort: OverviewSort | undefined;
  onlyUnread: boolean;
  page: number;
  pageSize: number;
}

interface OverviewFilterActions {
  selectView: (view: ErrandView) => void;
  setQuery: (query: string) => void;
  setFilter: (key: keyof ErrandFilters, value: string[]) => void;
  clearFilters: () => void;
  setOnlyUnread: (onlyUnread: boolean) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  toggleSort: (column: string) => void;
}

const DEFAULT_PAGE_SIZE = 12;

const initialState: OverviewFilterState = {
  selectedView: 'all',
  query: '',
  filters: emptyFilters,
  sort: undefined,
  onlyUnread: false,
  page: 0,
  pageSize: DEFAULT_PAGE_SIZE,
};

/**
 * Holds the overview list's filter, sort and paging state in a shared store rather than the page
 * component, so it survives navigating into an errand and back. Most changes reset to the first page.
 */
export const useOverviewFilterStore = create<OverviewFilterState & OverviewFilterActions>()(
  persist(
    (set) => ({
      ...initialState,
      selectView: (view) => {
        set((state) => ({
          selectedView: view,
          // The status filter only applies on "Alla ärenden" — clear it when moving to a scoped view.
          filters: view === 'all' ? state.filters : { ...state.filters, status: [] },
          page: 0,
        }));
      },
      setQuery: (query) => {
        set({ query, page: 0 });
      },
      setFilter: (key, value) => {
        set((state) => ({ filters: { ...state.filters, [key]: value }, page: 0 }));
      },
      clearFilters: () => {
        set({ filters: emptyFilters, page: 0 });
      },
      setOnlyUnread: (onlyUnread) => {
        set({ onlyUnread, page: 0 });
      },
      setPage: (page) => {
        set({ page });
      },
      setPageSize: (pageSize) => {
        set({ pageSize, page: 0 });
      },
      toggleSort: (column) => {
        set((state) => ({
          sort:
            state.sort?.column !== column ? { column, direction: 'asc' }
            : state.sort.direction === 'asc' ? { column, direction: 'desc' }
            : undefined,
          page: 0,
        }));
      },
    }),
    {
      name: 'drakel-overview-filter',
      // We rehydrate manually (after mount) via a guard in the page so the SSR/first client render uses the
      // default state and there's no hydration mismatch.
      skipHydration: true,
      // Persist the filter/sort/view, not the page position — a reload starts on the first page.
      partialize: (state) => ({
        selectedView: state.selectedView,
        query: state.query,
        filters: state.filters,
        sort: state.sort,
        onlyUnread: state.onlyUnread,
        pageSize: state.pageSize,
      }),
    }
  )
);
