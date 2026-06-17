'use client';

import { Button, FormControl, FormLabel, Input, Select } from '@sk-web-gui/react';
import { ListFilter } from 'lucide-react';
import NextLink from 'next/link';
import { useParams } from 'next/navigation';
import { FC, useState } from 'react';

export interface ErrandFilters {
  priority: string;
}

export const emptyFilters: ErrandFilters = { priority: '' };

const PRIORITIES = [
  { value: 'LOW', label: 'Låg' },
  { value: 'MEDIUM', label: 'Medel' },
  { value: 'HIGH', label: 'Hög' },
];

interface ErrandsFilterProps {
  query: string;
  onQueryChange: (query: string) => void;
  filters: ErrandFilters;
  onFilterChange: (key: keyof ErrandFilters, value: string) => void;
}

/** Overview filter row: search + a collapsible set of dropdown filters, plus the "new errand" action. */
export const ErrandsFilter: FC<ErrandsFilterProps> = ({ query, onQueryChange, filters, onFilterChange }) => {
  const { locale } = useParams<{ locale: string }>();
  const [show, setShow] = useState<boolean>(false);

  const activeCount = Object.values(filters).filter(Boolean).length;

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
            placeholder="Sök på titel eller ärendenummer…"
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
          <NextLink href={`/${locale}/registrera`} data-cy="register-new-errand-button">
            <Button color="vattjom" variant="primary">
              Nytt ärende
            </Button>
          </NextLink>
        </div>
      </div>

      {show && (
        <div className="flex flex-wrap gap-16 p-16 bg-background-200 rounded-12">
          <FormControl id="filter-priority" className="min-w-[20rem]">
            <FormLabel>Prioritet</FormLabel>
            <Select
              className="w-full"
              value={filters.priority}
              onChange={(event) => {
                onFilterChange('priority', event.target.value);
              }}
            >
              <Select.Option value="">Alla</Select.Option>
              {PRIORITIES.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
        </div>
      )}
    </div>
  );
};
