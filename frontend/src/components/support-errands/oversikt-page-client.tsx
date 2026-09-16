'use client';

import { useAdministrators } from '@hooks/use-administrators';
import { useErrands } from '@hooks/use-errands';
import { useStatuses } from '@hooks/use-statuses';
import { useUserStore } from '@services/user-service/user-service';
import { Spinner } from '@sk-web-gui/react';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { CLOSED_ERRAND_STATUS, ERRAND_VIEWS, ErrandView, NEW_ERRAND_STATUS } from './errand-views';
import { ErrandsFilter } from './errands-filter.component';
import { ErrandsTable } from './errands-table.component';
import { useOverviewFilterStore } from './overview-filter-store';
import { OverviewSidebar } from './overview-sidebar.component';

// Spring-filter (RSQL) value escaping — mirrors the BFF (backslash + single quote); values are single-quoted.
const escapeFilterValue = (value: string): string => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/**
 * The status clause for a sidebar view: Nya → RECEIVED, Avslutade → CLOSED, Öppna → neither new (RECEIVED) nor
 * closed (CLOSED), Alla → none. Öppna uses negation rather than listing the open statuses, since the STATUS
 * lookups can be empty and new statuses must not fall out of the view.
 */
const buildStatusClause = (view: ErrandView): string => {
  if (view === 'new') {
    return `status:'${NEW_ERRAND_STATUS}'`;
  }
  if (view === 'closed') {
    return `status:'${CLOSED_ERRAND_STATUS}'`;
  }
  if (view === 'open') {
    return `not(status:'${CLOSED_ERRAND_STATUS}') and not(status:'${NEW_ERRAND_STATUS}')`;
  }
  return '';
};

/** An OR group over one field, e.g. (status:'A' or status:'B'); empty string when no values. */
const orGroup = (field: string, values: string[]): string =>
  values.length > 0 ? `(${values.map((value) => `${field}:'${escapeFilterValue(value)}'`).join(' or ')})` : '';

/**
 * Builds the caremanagement filter from the overview controls. The sidebar view's status clause, the
 * status/priority/handläggare filter groups, "Mina ärenden" (the logged-in handläggare, when set) and the
 * free-text search (a case-insensitive "contains" over errand number and applicant name) are all ANDed together.
 */
const buildErrandFilter = (
  viewStatusClause: string,
  statusFilter: string[],
  priorityFilter: string[],
  assigneeFilter: string[],
  mineUsername: string | undefined,
  search: string
): string => {
  const clauses: string[] = [
    viewStatusClause,
    orGroup('status', statusFilter),
    orGroup('priority', priorityFilter),
    orGroup('assignedUserId', assigneeFilter),
    mineUsername ? orGroup('assignedUserId', [mineUsername]) : '',
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
  const onlyMine = useOverviewFilterStore((state) => state.onlyMine);
  const onlyUnread = useOverviewFilterStore((state) => state.onlyUnread);
  const page = useOverviewFilterStore((state) => state.page);
  const pageSize = useOverviewFilterStore((state) => state.pageSize);
  const selectView = useOverviewFilterStore((state) => state.selectView);
  const setQuery = useOverviewFilterStore((state) => state.setQuery);
  const setFilter = useOverviewFilterStore((state) => state.setFilter);
  const clearFilters = useOverviewFilterStore((state) => state.clearFilters);
  const setOnlyMine = useOverviewFilterStore((state) => state.setOnlyMine);
  const setOnlyUnread = useOverviewFilterStore((state) => state.setOnlyUnread);
  const setPage = useOverviewFilterStore((state) => state.setPage);
  const setPageSize = useOverviewFilterStore((state) => state.setPageSize);
  const toggleSort = useOverviewFilterStore((state) => state.toggleSort);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const username = useUserStore(useShallow((state) => state.user.username));
  const { statuses } = useStatuses();
  const { administrators } = useAdministrators();
  const filter = buildErrandFilter(
    buildStatusClause(selectedView),
    filters.status,
    filters.priority,
    filters.assignee,
    onlyMine ? username : undefined,
    query
  );
  // Handläggare are stored as usernames; show their Active Directory display names in the list.
  const assigneeName = useCallback(
    (assignedUserId: string): string =>
      administrators.find((admin) => admin.username === assignedUserId)?.displayName ?? assignedUserId,
    [administrators]
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
  const totalRecords = meta.totalRecords ?? errands.length;
  const heading = ERRAND_VIEWS.find((view) => view.key === selectedView)?.label ?? 'Alla ärenden';

  return (
    // The AppShell (header) wraps the page; the sidebar and the scrolling main column fill the rest.
    <div className="flex h-full w-full overflow-hidden">
      <OverviewSidebar
        selectedView={selectedView}
        onSelectView={selectView}
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
      />

      <main className="flex-1 min-w-0 overflow-y-auto bg-background-content px-24 md:px-40 py-40">
        <div className="w-full max-w-[140rem] mx-auto flex flex-col gap-24">
          <h1 className="m-0 text-h2-md md:text-h1-md">{heading}</h1>
          <ErrandsFilter
            query={query}
            onQueryChange={setQuery}
            filters={filters}
            onFilterChange={setFilter}
            onClearFilters={clearFilters}
            statuses={statuses}
            administrators={administrators}
            showStatusFilter={selectedView === 'all'}
            onlyMine={onlyMine}
            onOnlyMineChange={setOnlyMine}
            onlyUnread={onlyUnread}
            onOnlyUnreadChange={setOnlyUnread}
          />
          <p className="m-0 text-dark-secondary" aria-live="polite">
            {isLoading ? 'Hämtar ärenden…' : `Visar ${totalRecords} ${totalRecords === 1 ? 'ärende' : 'ärenden'}`}
          </p>
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
            assigneeName={assigneeName}
          />
        </div>
      </main>
    </div>
  );
};

/**
 * Gates the overview on the persisted filter/sort store finishing rehydration. The store uses
 * skipHydration, so SSR and the first client render show the spinner (matching markup → no hydration
 * mismatch); the content — and its first errand fetch — only mounts once the persisted state is in place.
 * On later mounts (navigating back) the store is already hydrated, so the spinner is skipped.
 */
export const OversiktPageClient = () => {
  // zustand only attaches the persist API where localStorage exists, so on the server the store counts as not
  // hydrated (rendering the spinner, same as the first client render).
  const [hydrated, setHydrated] = useState(
    () => typeof window !== 'undefined' && useOverviewFilterStore.persist.hasHydrated()
  );

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
