import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { ERRAND_VIEWS, ErrandView } from './errand-views';
import { emptyFilters, ErrandFilters } from './errands-filter.component';
import { SortDirection } from './errands-table.component';

interface OverviewSort {
  column: string;
  direction: SortDirection;
}

interface OverviewFilterState {
  selectedView: ErrandView;
  /** The committed free-text search. */
  query: string;
  filters: ErrandFilters;
  sort: OverviewSort | undefined;
  /** Only errands carrying a notification nobody has acted on. */
  onlyUnhandled: boolean;
  page: number;
  pageSize: number;
}

interface OverviewFilterActions {
  selectView: (view: ErrandView) => void;
  setQuery: (query: string) => void;
  setFilter: (key: keyof ErrandFilters, value: string[]) => void;
  clearFilters: () => void;
  setOnlyUnhandled: (onlyUnhandled: boolean) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  toggleSort: (column: string) => void;
}

const DEFAULT_PAGE_SIZE = 12;

const initialState: OverviewFilterState = {
  selectedView: 'ongoing',
  query: '',
  filters: emptyFilters,
  sort: undefined,
  onlyUnhandled: false,
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
          // Switching view changes what is in scope, so narrowings carried over from the previous view
          // would silently exclude everything. The handläggare filter is cleared on the way into a list
          // view in particular: it cannot be set there, so a stale one would empty the list with no way
          // to see why.
          filters: view === 'search' ? { ...state.filters, status: [] } : emptyFilters,
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
      setOnlyUnhandled: (onlyUnhandled) => {
        set({ onlyUnhandled, page: 0 });
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
      // Bumped whenever the set of views changes, or a persisted key is renamed: a browser holding a view
      // that no longer exists would otherwise select nothing, leaving the sidebar with no highlight and an
      // unfiltered list. Version 5 renamed onlyUnread to onlyUnhandled.
      version: 5,
      migrate: (persisted) => {
        const state = persisted as Partial<OverviewFilterState> | undefined;
        const view = state?.selectedView;
        return {
          ...state,
          selectedView: view && ERRAND_VIEWS.includes(view) ? view : 'ongoing',
          // A persisted filter object predates whichever groups were added since; merging over the
          // empty set keeps every group present, so reading `.length` on a new one cannot throw.
          filters: { ...emptyFilters, ...state?.filters },
        } as OverviewFilterState;
      },
      // We rehydrate manually (after mount) via a guard in the page so the SSR/first client render uses the
      // default state and there's no hydration mismatch.
      skipHydration: true,
      // Persist the filter/sort/view, not the page position — a reload starts on the first page.
      partialize: (state) => ({
        selectedView: state.selectedView,
        query: state.query,
        filters: state.filters,
        sort: state.sort,
        onlyUnhandled: state.onlyUnhandled,
        pageSize: state.pageSize,
      }),
    }
  )
);
