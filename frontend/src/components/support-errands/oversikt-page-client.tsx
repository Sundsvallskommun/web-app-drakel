'use client';

import { MainSidebar } from '@components/layout/main-sidebar.component';
import SidebarLayout from '@components/layout/sidebar-layout.component';
import { Lookup } from '@data-contracts/backend/data-contracts';
import { useAdministrators } from '@hooks/use-administrators';
import { useErrands } from '@hooks/use-errands';
import { useStatuses } from '@hooks/use-statuses';
import { Spinner } from '@sk-web-gui/react';
import { useEffect, useState } from 'react';

import { CLOSED_ERRAND_STATUS, ERRAND_VIEWS, ErrandView, NEW_ERRAND_STATUS } from './errand-views';
import { ErrandsFilter } from './errands-filter.component';
import { ErrandsTable } from './errands-table.component';
import { useOverviewFilterStore } from './overview-filter-store';

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
 * status/priority/handläggare filter groups and the free-text search (a case-insensitive "contains" over
 * errand number and applicant name) are all ANDed together.
 */
const buildErrandFilter = (
  viewStatusClause: string,
  statusFilter: string[],
  priorityFilter: string[],
  assigneeFilter: string[],
  search: string
): string => {
  const clauses: string[] = [
    viewStatusClause,
    orGroup('status', statusFilter),
    orGroup('priority', priorityFilter),
    orGroup('assignedUserId', assigneeFilter),
  ];
  const term = search.trim();
  if (term) {
    const escaped = escapeFilterValue(term);
    clauses.push(`(errandNumber~~'*${escaped}*' or applicantName~~'*${escaped}*')`);
  }
  return clauses.filter(Boolean).join(' and ');
};

const OversiktPageContent = () => {
  // Filter/sort/paging state lives in a shared store so it survives navigating into an errand and back.
  const selectedView = useOverviewFilterStore((state) => state.selectedView);
  const query = useOverviewFilterStore((state) => state.query);
  const filters = useOverviewFilterStore((state) => state.filters);
  const sort = useOverviewFilterStore((state) => state.sort);
  const onlyUnread = useOverviewFilterStore((state) => state.onlyUnread);
  const page = useOverviewFilterStore((state) => state.page);
  const pageSize = useOverviewFilterStore((state) => state.pageSize);
  const selectView = useOverviewFilterStore((state) => state.selectView);
  const setQuery = useOverviewFilterStore((state) => state.setQuery);
  const setFilter = useOverviewFilterStore((state) => state.setFilter);
  const clearFilters = useOverviewFilterStore((state) => state.clearFilters);
  const setOnlyUnread = useOverviewFilterStore((state) => state.setOnlyUnread);
  const setPage = useOverviewFilterStore((state) => state.setPage);
  const setPageSize = useOverviewFilterStore((state) => state.setPageSize);
  const toggleSort = useOverviewFilterStore((state) => state.toggleSort);

  const { statuses } = useStatuses();
  const { administrators } = useAdministrators();
  const filter = buildErrandFilter(
    buildStatusClause(selectedView, statuses),
    filters.status,
    filters.priority,
    filters.assignee,
    query
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
              onFilterChange={setFilter}
              onClearFilters={clearFilters}
              statuses={statuses}
              administrators={administrators}
              showStatusFilter={selectedView === 'all'}
              onlyUnread={onlyUnread}
              onOnlyUnreadChange={setOnlyUnread}
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
                onPageSizeChange={setPageSize}
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

/**
 * Gates the overview on the persisted filter/sort store finishing rehydration. The store uses
 * skipHydration, so SSR and the first client render show the spinner (matching markup → no hydration
 * mismatch); the content — and its first errand fetch — only mounts once the persisted state is in place.
 * On later mounts (navigating back) the store is already hydrated, so the spinner is skipped.
 */
export const OversiktPageClient = () => {
  const [hydrated, setHydrated] = useState(() => useOverviewFilterStore.persist.hasHydrated());

  useEffect(() => {
    const unsubscribe = useOverviewFilterStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    void useOverviewFilterStore.persist.rehydrate();
    return unsubscribe;
  }, []);

  if (!hydrated) {
    return (
      <div className="flex justify-center my-32">
        <Spinner size={5} />
      </div>
    );
  }

  return <OversiktPageContent />;
};
