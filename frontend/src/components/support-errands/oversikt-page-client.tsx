'use client';

import { MainSidebar } from '@components/layout/main-sidebar.component';
import SidebarLayout from '@components/layout/sidebar-layout.component';
import { Lookup } from '@data-contracts/backend/data-contracts';
import { useErrands } from '@hooks/use-errands';
import { useStatuses } from '@hooks/use-statuses';
import { useEffect, useState } from 'react';

import { CLOSED_ERRAND_STATUS, ERRAND_VIEWS, ErrandView, NEW_ERRAND_STATUS } from './errand-views';
import { emptyFilters, ErrandFilters, ErrandsFilter } from './errands-filter.component';
import { ErrandsTable, SortDirection } from './errands-table.component';

const DEFAULT_PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;

// Spring-filter (RSQL) value escaping — mirrors the BFF (backslash + single quote); values are single-quoted.
const escapeFilterValue = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/**
 * The status clause for a sidebar view: Nya → RECEIVED, Avslutade → CLOSED, Öppna → every status except the
 * new (RECEIVED) and closed (CLOSED) ones (built as an OR over the known statuses, since the filter dialect
 * has no not-equals), Alla → none.
 */
const buildStatusClause = (view: ErrandView, statuses: Lookup[]): string => {
  if (view === 'new') {
    return `status:'${NEW_ERRAND_STATUS}'`;
  }
  if (view === 'closed') {
    return `status:'${CLOSED_ERRAND_STATUS}'`;
  }
  if (view === 'open') {
    const openStatuses = statuses
      .map((status) => status.name)
      .filter((name): name is string => !!name && name !== CLOSED_ERRAND_STATUS && name !== NEW_ERRAND_STATUS);
    return openStatuses.length > 0 ? `(${openStatuses.map((name) => `status:'${name}'`).join(' or ')})` : '';
  }
  return '';
};

/** An OR group over one field, e.g. (status:'A' or status:'B'); empty string when no values. */
const orGroup = (field: string, values: string[]): string =>
  values.length > 0 ? `(${values.map((value) => `${field}:'${escapeFilterValue(value)}'`).join(' or ')})` : '';

/**
 * Builds the caremanagement filter from the overview controls. The sidebar view's status clause, the
 * status/priority filter groups and the free-text search (a case-insensitive "contains" over errand number
 * and applicant name) are all ANDed together.
 */
const buildErrandFilter = (
  viewStatusClause: string,
  statusFilter: string[],
  priorityFilter: string[],
  search: string
): string => {
  const clauses: string[] = [viewStatusClause, orGroup('status', statusFilter), orGroup('priority', priorityFilter)];
  const term = search.trim();
  if (term) {
    const escaped = escapeFilterValue(term);
    clauses.push(`(errandNumber~~'*${escaped}*' or applicantName~~'*${escaped}*')`);
  }
  return clauses.filter(Boolean).join(' and ');
};

export const OversiktPageClient = () => {
  const [onlyUnread, setOnlyUnread] = useState<boolean>(false);
  // Server-side sort (?sort=<column>,<dir>); undefined = default order.
  const [sort, setSort] = useState<{ column: string; direction: SortDirection } | undefined>(undefined);
  const [selectedView, setSelectedView] = useState<ErrandView>('all');
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [filters, setFilters] = useState<ErrandFilters>(emptyFilters);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Debounce the free-text search so each keystroke doesn't fire a request; reset to the first page on change.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const { statuses } = useStatuses();
  const filter = buildErrandFilter(
    buildStatusClause(selectedView, statuses),
    filters.status,
    filters.priority,
    debouncedQuery
  );

  // Filtering, sorting and paging are all done server-side (caremanagement); the response's _meta drives
  // the pagination.
  const { errands, meta, isLoading, error } = useErrands({
    page,
    size: pageSize,
    filter: filter || undefined,
    sort: sort ? [`${sort.column},${sort.direction}`] : undefined,
    hasUnacknowledgedNotifications: onlyUnread || undefined,
  });

  const totalPages = meta.totalPages ?? 1;

  const selectView = (view: ErrandView) => {
    setSelectedView(view);
    // The status filter only applies on "Alla ärenden"; clear it when moving to a status-scoped view.
    if (view !== 'all') {
      setFilters((current) => ({ ...current, status: [] }));
    }
    setPage(0);
  };

  const changeFilter = (key: keyof ErrandFilters, value: string[]) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  };

  const clearFilters = () => {
    setFilters(emptyFilters);
    setPage(0);
  };

  const changeOnlyUnread = (checked: boolean) => {
    setOnlyUnread(checked);
    setPage(0);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  // Toggle a column's server-side sort: none → asc → desc → none.
  const toggleSort = (column: string) => {
    setSort((current) =>
      current?.column !== column ? { column, direction: 'asc' }
      : current.direction === 'asc' ? { column, direction: 'desc' }
      : undefined
    );
    setPage(0);
  };

  const heading = ERRAND_VIEWS.find((view) => view.key === selectedView)?.label ?? 'Alla ärenden';

  return (
    <SidebarLayout
      renderSidebar={(open, setOpen) => (
        <MainSidebar selectedView={selectedView} onSelectView={selectView} open={open} setOpen={setOpen} />
      )}
    >
      <div className="w-full">
        <div className="box-border py-10 px-40 max-sm:px-24 w-full flex justify-center shadow-lg min-h-[8rem]">
          <div className="w-full container px-0 flex flex-col gap-12">
            <ErrandsFilter
              query={query}
              onQueryChange={setQuery}
              filters={filters}
              onFilterChange={changeFilter}
              onClearFilters={clearFilters}
              statuses={statuses}
              showStatusFilter={selectedView === 'all'}
              onlyUnread={onlyUnread}
              onOnlyUnreadChange={changeOnlyUnread}
            />
          </div>
        </div>

        <main className="pl-40 max-sm:pl-24 pb-40 w-full">
          <div className="container mx-auto p-0 w-full">
            <div className="mt-32 flex flex-col gap-16">
              <h1 className="p-0 m-0">{heading}</h1>
              <ErrandsTable
                errands={errands}
                isLoading={isLoading}
                error={error}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
                pageSize={pageSize}
                onPageSizeChange={changePageSize}
                sortColumn={sort?.column}
                sortDirection={sort?.direction}
                onSort={toggleSort}
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarLayout>
  );
};
