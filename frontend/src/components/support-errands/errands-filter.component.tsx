'use client';

import { Lookup } from '@data-contracts/backend/data-contracts';
import { useDebouncedValue } from '@hooks/use-debounced-value';
import { Administrator } from '@services/administrator-service';
import { Checkbox, Chip, SearchField } from '@sk-web-gui/react';
import { FC, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrandFilterDropdown, FilterOption } from './errand-filter-dropdown.component';

// How long typing has to pause before "Filtrera i listan" refetches the list.
const SEARCH_DEBOUNCE_MS = 400;

/** Active overview filters; each is multi-select (an OR within each group, AND between groups). */
export interface ErrandFilters {
  status: string[];
  assignee: string[];
}

export const emptyFilters: ErrandFilters = { status: [], assignee: [] };

interface ErrandsFilterProps {
  query: string;
  onQueryChange: (query: string) => void;
  filters: ErrandFilters;
  onFilterChange: (key: keyof ErrandFilters, value: string[]) => void;
  onClearFilters: () => void;
  statuses: Lookup[];
  administrators: Administrator[];
  /** The status filter is only offered on the "Alla ärenden" view (the other views already scope status). */
  onlyMine: boolean;
  onOnlyMineChange: (checked: boolean) => void;
  onlyUnread: boolean;
  onOnlyUnreadChange: (checked: boolean) => void;
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
  administrators,
  onlyMine,
  onOnlyMineChange,
  onlyUnread,
  onOnlyUnreadChange,
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

  // Known status codes use the UI-language label; unknown ones fall back to the lookup's display name.
  const statusOptions: FilterOption[] = statuses.map((status) => ({
    value: status.name ?? '',
    label: t(`common:status.${(status.name ?? '').toUpperCase()}`, {
      defaultValue: status.displayName ?? status.name ?? '',
    }),
  }));
  const assigneeOptions: FilterOption[] = administrators.map((admin) => ({
    value: admin.username,
    label: admin.displayName,
  }));

  const statusLabel = (value: string): string => statusOptions.find((option) => option.value === value)?.label ?? value;
  const assigneeLabel = (value: string): string =>
    assigneeOptions.find((option) => option.value === value)?.label ?? value;

  const activeCount = filters.status.length + filters.assignee.length;

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
          label={t('filter.assignee')}
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
            {t('filter.onlyMine')}
          </Checkbox>
          <Checkbox
            checked={onlyUnread}
            onChange={(event) => {
              onOnlyUnreadChange(event.target.checked);
            }}
          >
            {t('filter.onlyUnread')}
          </Checkbox>
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
