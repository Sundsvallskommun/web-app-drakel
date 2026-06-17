'use client';

import { MainSidebar } from '@components/layout/main-sidebar.component';
import SidebarLayout from '@components/layout/sidebar-layout.component';
import { useErrands } from '@hooks/use-errands';
import { useStatuses } from '@hooks/use-statuses';
import { useMemo, useState } from 'react';

import { emptyFilters, ErrandFilters, ErrandsFilter } from './errands-filter.component';
import { ErrandsTable } from './errands-table.component';

const PAGE_SIZE = 12;
// Status filtering, search and counts are computed client-side over a single fetched batch.
// Server-side filtering (RSQL) and counts can replace this when needed.
const FETCH_SIZE = 100;

export const OversiktPageClient = () => {
  const { errands, isLoading, error } = useErrands({ page: 0, size: FETCH_SIZE });
  const { statuses } = useStatuses();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [filters, setFilters] = useState<ErrandFilters>(emptyFilters);
  const [page, setPage] = useState<number>(0);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    errands.forEach((errand) => {
      if (errand.status) {
        map[errand.status] = (map[errand.status] ?? 0) + 1;
      }
    });
    return map;
  }, [errands]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return errands.filter((errand) => {
      if (selectedStatus && errand.status !== selectedStatus) {
        return false;
      }
      if (filters.category && errand.category !== filters.category) {
        return false;
      }
      if (filters.type && errand.type !== filters.type) {
        return false;
      }
      if (filters.priority && errand.priority !== filters.priority) {
        return false;
      }
      if (!search) {
        return true;
      }
      return [errand.title, errand.errandNumber, errand.category, errand.type, errand.contactReason]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [errands, selectedStatus, query, filters]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageErrands = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const selectStatus = (status: string | null) => {
    setSelectedStatus(status);
    setPage(0);
  };

  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(0);
  };

  const changeFilter = (key: keyof ErrandFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  };

  const heading =
    selectedStatus ?
      (statuses.find((status) => status.name === selectedStatus)?.displayName ?? selectedStatus)
    : 'Alla ärenden';

  return (
    <SidebarLayout
      renderSidebar={(open, setOpen) => (
        <MainSidebar
          statuses={statuses}
          counts={counts}
          totalCount={errands.length}
          selectedStatus={selectedStatus}
          onSelectStatus={selectStatus}
          open={open}
          setOpen={setOpen}
        />
      )}
    >
      <div className="w-full">
        <div className="box-border py-10 px-40 max-sm:px-24 w-full flex justify-center shadow-lg min-h-[8rem]">
          <div className="w-full container px-0">
            <ErrandsFilter query={query} onQueryChange={changeQuery} filters={filters} onFilterChange={changeFilter} />
          </div>
        </div>

        <main className="pl-40 max-sm:pl-24 pb-40 w-full">
          <div className="container mx-auto p-0 w-full">
            <div className="mt-32 flex flex-col gap-16">
              <h1 className="p-0 m-0">{heading}</h1>
              <ErrandsTable
                errands={pageErrands}
                isLoading={isLoading}
                error={error}
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        </main>
      </div>
    </SidebarLayout>
  );
};
