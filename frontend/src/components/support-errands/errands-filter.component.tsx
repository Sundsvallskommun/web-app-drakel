'use client';

import { Lookup } from '@data-contracts/backend/data-contracts';
import { useDebouncedValue } from '@hooks/use-debounced-value';
import { Administrator } from '@services/administrator-service';
import { Button, Checkbox, Chip, SearchField } from '@sk-web-gui/react';
import { Search } from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrandFilterDropdown, FilterOption } from './errand-filter-dropdown.component';

// How long typing has to pause before "Filtrera i listan" refetches the list.
const SEARCH_DEBOUNCE_MS = 400;

/** Active overview filters; each is multi-select (an OR within each group, AND between groups). */
export interface ErrandFilters {
  status: string[];
  type: string[];
  assignee: string[];
}

export const emptyFilters: ErrandFilters = { status: [], type: [], assignee: [] };

interface ErrandsFilterProps {
  query: string;
  onQueryChange: (query: string) => void;
  filters: ErrandFilters;
  onFilterChange: (key: keyof ErrandFilters, value: string[]) => void;
  onClearFilters: () => void;
  statuses: Lookup[];
  errandTypes: Lookup[];
  administrators: Administrator[];
  onlyUnhandled: boolean;
  onOnlyUnhandledChange: (checked: boolean) => void;
  /**
   * Whether the handläggare filter is offered. On the list views everything is already the handläggare's
   * own, so narrowing by handläggare could only ever empty the list.
   */
  showAssigneeFilter?: boolean;
  /**
   * When set, the filter acts as a search form: nothing is fetched until this runs. It is handed the
   * search term as typed — the committed `query` lags behind by the debounce, so reading that instead
   * would search for what was typed a moment ago.
   */
  onSearch?: (query: string) => void;
}

/**
 * Overview filter bar: a grey group with "Filtrera i listan" (filters as you type, on errand number and
 * applicant), the status/handläggare dropdowns and the "Mina ärenden" / "Olästa meddelanden"
 * checkboxes, with the active filter values as removable chips below.
 */
export const ErrandsFilter: FC<ErrandsFilterProps> = ({
  query,
  onQueryChange,
  filters,
  onFilterChange,
  onClearFilters,
  statuses,
  errandTypes,
  administrators,
  onlyUnhandled,
  onOnlyUnhandledChange,
  showAssigneeFilter = true,
  onSearch,
}) => {
  const { t } = useTranslation('overview');
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

  // caremanagement's own Swedish label from the errand type, falling back to the local table for a
  // status the catalogue does not name.
  const statusOptions: FilterOption[] = statuses.map((status) => ({
    value: status.name ?? '',
    label:
      status.displayName ??
      t(`common:status.${(status.name ?? '').toUpperCase()}`, { defaultValue: status.name ?? '' }),
  }));
  const typeOptions: FilterOption[] = errandTypes.map((type) => ({
    value: type.name ?? '',
    label: type.displayName ?? type.name ?? '',
  }));
  const assigneeOptions: FilterOption[] = administrators.map((admin) => ({
    value: admin.username,
    label: admin.displayName,
  }));

  const statusLabel = (value: string): string => statusOptions.find((option) => option.value === value)?.label ?? value;
  const typeLabel = (value: string): string => typeOptions.find((option) => option.value === value)?.label ?? value;
  const assigneeLabel = (value: string): string =>
    assigneeOptions.find((option) => option.value === value)?.label ?? value;

  const activeCount = filters.status.length + filters.type.length + filters.assignee.length;
  // Searching needs something to search for: a term, a chosen status or handläggare, or the unread
  // narrowing. Without that the Sök view would just list every errand in the municipality.
  const canSearch =
    searchInput.trim() !== '' || filters.status.length > 0 || filters.assignee.length > 0 || onlyUnhandled;

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
          placeholder={t('filter.searchPlaceholder')}
          aria-label={t('filter.searchLabel')}
          onChange={(event) => {
            setSearchInput(event.target.value);
          }}
          onSearch={() => {
            applySearch(searchInput);
            if (canSearch) {
              onSearch?.(searchInput);
            }
          }}
          onReset={() => {
            setSearchInput('');
            applySearch('');
          }}
        />
        <ErrandFilterDropdown
          label={t('filter.status')}
          options={statusOptions}
          selected={filters.status}
          searchable
          onChange={(values) => {
            onFilterChange('status', values);
          }}
        />
        <ErrandFilterDropdown
          label={t('filter.type')}
          options={typeOptions}
          selected={filters.type}
          onChange={(values) => {
            onFilterChange('type', values);
          }}
        />
        {showAssigneeFilter ?
          <ErrandFilterDropdown
            label={t('filter.assignee')}
            options={assigneeOptions}
            selected={filters.assignee}
            searchable
            onChange={(values) => {
              onFilterChange('assignee', values);
            }}
          />
        : null}
        <div className="flex flex-1 flex-wrap items-center justify-end gap-x-24 gap-y-8 text-small text-dark-secondary">
          <Checkbox
            checked={onlyUnhandled}
            onChange={(event) => {
              onOnlyUnhandledChange(event.target.checked);
            }}
          >
            {t('filter.onlyUnhandled')}
          </Checkbox>
          {onSearch ?
            <Button
              size="sm"
              variant="primary"
              color="primary"
              leftIcon={<Search />}
              disabled={!canSearch}
              onClick={() => {
                applySearch(searchInput);
                onSearch(searchInput);
              }}
            >
              {t('filter.search')}
            </Button>
          : null}
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex gap-8 flex-wrap items-center">
          {filters.status.map((value) => (
            <Chip
              key={`status-${value}`}
              aria-label={t('filter.clearStatus', { status: statusLabel(value) })}
              onClick={() => {
                removeValue('status', value);
              }}
            >
              {statusLabel(value)}
            </Chip>
          ))}
          {filters.type.map((value) => (
            <Chip
              key={`type-${value}`}
              aria-label={t('filter.clearType', { type: typeLabel(value) })}
              onClick={() => {
                removeValue('type', value);
              }}
            >
              {t('filter.typeChip', { type: typeLabel(value) })}
            </Chip>
          ))}
          {filters.assignee.map((value) => (
            <Chip
              key={`assignee-${value}`}
              aria-label={t('filter.clearAssignee', { assignee: assigneeLabel(value) })}
              onClick={() => {
                removeValue('assignee', value);
              }}
            >
              {assigneeLabel(value)}
            </Chip>
          ))}
          <Chip aria-label={t('filter.clearAllLabel')} onClick={onClearFilters}>
            {t('filter.clearAll')}
          </Chip>
        </div>
      )}
    </div>
  );
};
