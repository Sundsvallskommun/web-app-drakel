'use client';

import { Lookup } from '@data-contracts/backend/data-contracts';
import { useDebouncedValue } from '@hooks/use-debounced-value';
import { Administrator } from '@services/administrator-service';
import { Checkbox, Chip, SearchField } from '@sk-web-gui/react';
import { PRIORITY_OPTIONS } from '@utils/errand-priority';
import { errandStatusLabel } from '@utils/errand-status';
import { FC, useEffect, useRef, useState } from 'react';

import { ErrandFilterDropdown, FilterOption } from './errand-filter-dropdown.component';

// How long typing has to pause before "Filtrera i listan" refetches the list.
const SEARCH_DEBOUNCE_MS = 400;

/** Active overview filters; each is multi-select (an OR within each group, AND between groups). */
export interface ErrandFilters {
  status: string[];
  priority: string[];
  assignee: string[];
}

export const emptyFilters: ErrandFilters = { status: [], priority: [], assignee: [] };

interface ErrandsFilterProps {
  query: string;
  onQueryChange: (query: string) => void;
  filters: ErrandFilters;
  onFilterChange: (key: keyof ErrandFilters, value: string[]) => void;
  onClearFilters: () => void;
  statuses: Lookup[];
  administrators: Administrator[];
  /** The status filter is only offered on the "Alla ärenden" view (the other views already scope status). */
  showStatusFilter: boolean;
  onlyMine: boolean;
  onOnlyMineChange: (checked: boolean) => void;
  onlyUnread: boolean;
  onOnlyUnreadChange: (checked: boolean) => void;
}

/**
 * Overview filter bar: a grey group with "Filtrera i listan" (filters as you type, on errand number and
 * applicant), the status/priority/handläggare dropdowns and the "Mina ärenden" / "Olästa meddelanden"
 * checkboxes, with the active filter values as removable chips below.
 */
export const ErrandsFilter: FC<ErrandsFilterProps> = ({
  query,
  onQueryChange,
  filters,
  onFilterChange,
  onClearFilters,
  statuses,
  administrators,
  showStatusFilter,
  onlyMine,
  onOnlyMineChange,
  onlyUnread,
  onOnlyUnreadChange,
}) => {
  const [searchInput, setSearchInput] = useState<string>(query);
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);
  // The last search applied to the list, so a debounced value that was already committed (by Enter) isn't
  // applied a second time.
  const appliedSearchRef = useRef<string>(query);

  const applySearch = (search: string) => {
    appliedSearchRef.current = search;
    onQueryChange(search);
  };

  useEffect(() => {
    if (debouncedSearch !== appliedSearchRef.current) {
      appliedSearchRef.current = debouncedSearch;
      onQueryChange(debouncedSearch);
    }
  }, [debouncedSearch, onQueryChange]);

  const statusOptions: FilterOption[] = statuses.map((status) => ({
    value: status.name ?? '',
    label: status.displayName ?? errandStatusLabel(status.name ?? ''),
  }));
  const assigneeOptions: FilterOption[] = administrators.map((admin) => ({
    value: admin.username,
    label: admin.displayName,
  }));

  const statusLabel = (value: string): string => statusOptions.find((option) => option.value === value)?.label ?? value;
  const priorityLabel = (value: string): string =>
    PRIORITY_OPTIONS.find((option) => option.value === value)?.label ?? value;
  const assigneeLabel = (value: string): string =>
    assigneeOptions.find((option) => option.value === value)?.label ?? value;

  const activeCount = filters.status.length + filters.priority.length + filters.assignee.length;

  const removeValue = (key: keyof ErrandFilters, value: string) => {
    onFilterChange(
      key,
      filters[key].filter((item) => item !== value)
    );
  };

  return (
    <div className="w-full flex flex-col gap-16">
      <div className="w-full flex flex-wrap items-center gap-4 rounded-16 bg-background-color-mixin-1 py-12 pl-12 pr-16">
        <SearchField
          className="w-full sm:w-[22rem] mr-4"
          size="md"
          value={searchInput}
          showSearchButton={false}
          placeholder="Filtrera i listan"
          aria-label="Filtrera i listan på ärendenummer eller sökande"
          onChange={(event) => {
            setSearchInput(event.target.value);
          }}
          onSearch={() => {
            applySearch(searchInput);
          }}
          onReset={() => {
            setSearchInput('');
            applySearch('');
          }}
        />
        {showStatusFilter && (
          <ErrandFilterDropdown
            label="Status"
            options={statusOptions}
            selected={filters.status}
            searchable
            onChange={(values) => {
              onFilterChange('status', values);
            }}
          />
        )}
        <ErrandFilterDropdown
          label="Prioritet"
          options={PRIORITY_OPTIONS}
          selected={filters.priority}
          onChange={(values) => {
            onFilterChange('priority', values);
          }}
        />
        <ErrandFilterDropdown
          label="Handläggare"
          options={assigneeOptions}
          selected={filters.assignee}
          searchable
          onChange={(values) => {
            onFilterChange('assignee', values);
          }}
        />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-x-24 gap-y-8 text-small text-dark-secondary">
          <Checkbox
            checked={onlyMine}
            onChange={(event) => {
              onOnlyMineChange(event.target.checked);
            }}
          >
            Mina ärenden
          </Checkbox>
          <Checkbox
            checked={onlyUnread}
            onChange={(event) => {
              onOnlyUnreadChange(event.target.checked);
            }}
          >
            Olästa meddelanden
          </Checkbox>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex gap-8 flex-wrap items-center">
          {filters.status.map((value) => (
            <Chip
              key={`status-${value}`}
              aria-label={`Rensa status ${statusLabel(value)}`}
              onClick={() => {
                removeValue('status', value);
              }}
            >
              {statusLabel(value)}
            </Chip>
          ))}
          {filters.priority.map((value) => (
            <Chip
              key={`priority-${value}`}
              aria-label={`Rensa prioritet ${priorityLabel(value)}`}
              onClick={() => {
                removeValue('priority', value);
              }}
            >
              {priorityLabel(value)} prioritet
            </Chip>
          ))}
          {filters.assignee.map((value) => (
            <Chip
              key={`assignee-${value}`}
              aria-label={`Rensa handläggare ${assigneeLabel(value)}`}
              onClick={() => {
                removeValue('assignee', value);
              }}
            >
              {assigneeLabel(value)}
            </Chip>
          ))}
          <Chip aria-label="Rensa alla filter" onClick={onClearFilters}>
            Rensa alla
          </Chip>
        </div>
      )}
    </div>
  );
};
