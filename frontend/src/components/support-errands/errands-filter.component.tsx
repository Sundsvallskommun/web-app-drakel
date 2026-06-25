'use client';

import { Lookup } from '@data-contracts/backend/data-contracts';
import { Button, Checkbox, Chip, Combobox, FormControl, FormLabel, Input } from '@sk-web-gui/react';
import { ListFilter } from 'lucide-react';
import { FC, useState } from 'react';

/** Active overview filters; both are multi-select (an OR within each group, AND between groups). */
export interface ErrandFilters {
  status: string[];
  priority: string[];
}

export const emptyFilters: ErrandFilters = { status: [], priority: [] };

const PRIORITIES = [
  { value: 'LOW', label: 'Låg' },
  { value: 'MEDIUM', label: 'Medel' },
  { value: 'HIGH', label: 'Hög' },
];

// A multi-select combobox reports its value as a string[]; guard against the single-string shape.
const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string')
  : typeof value === 'string' && value ? [value]
  : [];

interface ErrandsFilterProps {
  query: string;
  onQueryChange: (query: string) => void;
  filters: ErrandFilters;
  onFilterChange: (key: keyof ErrandFilters, value: string[]) => void;
  onClearFilters: () => void;
  statuses: Lookup[];
  /** The status filter is only offered on the "Alla ärenden" view (the other views already scope status). */
  showStatusFilter: boolean;
  onlyUnread: boolean;
  onOnlyUnreadChange: (checked: boolean) => void;
}

/** Overview filter row: search + status/priority comboboxes (open by default) and removable filter chips. */
export const ErrandsFilter: FC<ErrandsFilterProps> = ({
  query,
  onQueryChange,
  filters,
  onFilterChange,
  onClearFilters,
  statuses,
  showStatusFilter,
  onlyUnread,
  onOnlyUnreadChange,
}) => {
  const [show, setShow] = useState<boolean>(true);

  const statusLabel = (value: string): string => statuses.find((status) => status.name === value)?.displayName ?? value;
  const priorityLabel = (value: string): string => PRIORITIES.find((priority) => priority.value === value)?.label ?? value;

  const activeCount = filters.status.length + filters.priority.length;

  const removeValue = (key: keyof ErrandFilters, value: string) => {
    onFilterChange(
      key,
      filters[key].filter((item) => item !== value)
    );
  };

  return (
    <div className="w-full flex flex-col gap-16 py-19">
      <div className="w-full flex flex-wrap items-end justify-between gap-16">
        <div className="flex flex-col gap-8 max-w-[40rem] w-full">
          <label htmlFor="errand-search" className="text-small font-bold">
            Sök ärenden
          </label>
          <Input
            id="errand-search"
            value={query}
            onChange={(event) => {
              onQueryChange(event.target.value);
            }}
            placeholder="Sök på ärendenummer eller sökande…"
          />
        </div>
        <div className="flex gap-16">
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
      </div>

      {show && (
        <div className="flex flex-wrap gap-16 p-16 bg-background-200 rounded-12">
          {showStatusFilter && (
            <FormControl id="filter-status" className="min-w-[24rem]">
              <FormLabel>Status</FormLabel>
              <Combobox
                multiple
                value={filters.status}
                placeholder="Alla statusar"
                searchPlaceholder="Sök status…"
                onChange={(event) => {
                  onFilterChange('status', asStringArray(event.target.value));
                }}
              >
                <Combobox.Input className="w-full" />
                <Combobox.List>
                  {statuses.map((status) => (
                    <Combobox.Option key={status.name} value={status.name ?? ''}>
                      {status.displayName ?? status.name ?? ''}
                    </Combobox.Option>
                  ))}
                </Combobox.List>
              </Combobox>
            </FormControl>
          )}

          <FormControl id="filter-priority" className="min-w-[24rem]">
            <FormLabel>Prioritet</FormLabel>
            <Combobox
              multiple
              value={filters.priority}
              placeholder="Alla prioriteter"
              searchPlaceholder="Sök prioritet…"
              onChange={(event) => {
                onFilterChange('priority', asStringArray(event.target.value));
              }}
            >
              <Combobox.Input className="w-full" />
              <Combobox.List>
                {PRIORITIES.map((priority) => (
                  <Combobox.Option key={priority.value} value={priority.value}>
                    {priority.label}
                  </Combobox.Option>
                ))}
              </Combobox.List>
            </Combobox>
          </FormControl>

          <div className="basis-full">
            <Checkbox
              checked={onlyUnread}
              onChange={(event) => {
                onOnlyUnreadChange(event.target.checked);
              }}
            >
              Visa endast ärenden med olästa meddelanden
            </Checkbox>
          </div>
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
          <Chip aria-label="Rensa alla filter" onClick={onClearFilters}>
            Rensa alla
          </Chip>
        </div>
      )}
    </div>
  );
};
