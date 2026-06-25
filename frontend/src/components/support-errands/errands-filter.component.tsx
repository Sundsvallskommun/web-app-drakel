'use client';

import { Lookup } from '@data-contracts/backend/data-contracts';
import { Administrator } from '@services/administrator-service';
import { Button, Checkbox, Chip, SearchField } from '@sk-web-gui/react';
import { ListFilter } from 'lucide-react';
import { FC, useState } from 'react';

import { ErrandFilterDropdown, FilterOption } from './errand-filter-dropdown.component';

/** Active overview filters; each is multi-select (an OR within each group, AND between groups). */
export interface ErrandFilters {
  status: string[];
  priority: string[];
  assignee: string[];
}

export const emptyFilters: ErrandFilters = { status: [], priority: [], assignee: [] };

const PRIORITY_OPTIONS: FilterOption[] = [
  { value: 'LOW', label: 'Låg' },
  { value: 'MEDIUM', label: 'Medel' },
  { value: 'HIGH', label: 'Hög' },
];

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
  onlyUnread: boolean;
  onOnlyUnreadChange: (checked: boolean) => void;
}

/**
 * Overview filter row (draken-style): a search field with a Sök button, a "Dölj filter" toggle, and — when
 * open — a bar of dropdown filters (status/priority) plus the "olästa meddelanden" checkbox and removable
 * filter chips.
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
  onlyUnread,
  onOnlyUnreadChange,
}) => {
  const [show, setShow] = useState<boolean>(true);
  // The search field commits on Sök/Enter (not on every keystroke), so it holds its own editing value.
  const [searchInput, setSearchInput] = useState<string>(query);

  const statusOptions: FilterOption[] = statuses.map((status) => ({
    value: status.name ?? '',
    label: status.displayName ?? status.name ?? '',
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
    <div className="w-full flex flex-col gap-16 py-19">
      <div className="w-full flex flex-wrap items-center justify-between gap-16">
        <SearchField
          className="flex-grow max-w-[48rem]"
          value={searchInput}
          showSearchButton
          placeholder="Sök på ärendenummer eller sökande…"
          onChange={(event) => {
            setSearchInput(event.target.value);
          }}
          onSearch={() => {
            onQueryChange(searchInput);
          }}
          onReset={() => {
            setSearchInput('');
            onQueryChange('');
          }}
        />
        <Button
          onClick={() => {
            setShow(!show);
          }}
          variant={show ? 'tertiary' : 'primary'}
          inverted={!show}
          color="vattjom"
          leftIcon={<ListFilter />}
        >
          {show ? 'Dölj filter' : `Visa filter${activeCount ? ` (${activeCount})` : ''}`}
        </Button>
      </div>

      {show && (
        <div className="flex flex-wrap gap-16 items-center">
          <div className="flex flex-wrap items-center gap-4 p-10 bg-background-200 rounded-12">
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
          </div>
          <Checkbox
            checked={onlyUnread}
            onChange={(event) => {
              onOnlyUnreadChange(event.target.checked);
            }}
          >
            Visa endast ärenden med olästa meddelanden
          </Checkbox>
        </div>
      )}

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
