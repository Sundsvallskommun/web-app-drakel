'use client';

import { Checkbox, PopupMenu, SearchField } from '@sk-web-gui/react';
import { ChevronDown } from 'lucide-react';
import { FC, useState } from 'react';

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * A draken-style filter "combobox": a dropdown button that opens a checkbox list for multi-select, with an
 * optional search field for long option lists. Controlled — the selected values and the change handler are
 * owned by the parent.
 */
export const ErrandFilterDropdown: FC<{
  label: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  /** Show a search field above the options (for long lists such as statuses). */
  searchable?: boolean;
}> = ({ label, options, selected, onChange, searchable = false }) => {
  const [query, setQuery] = useState<string>('');

  const visibleOptions =
    searchable && query ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())) : options;

  const toggle = (value: string, checked: boolean) => {
    onChange(checked ? [...selected, value] : selected.filter((item) => item !== value));
  };

  return (
    // The PopupMenu panel is positioned absolutely, so it needs a `relative` ancestor to anchor to the
    // button (otherwise it ends up in the top-left of the page).
    <div className="relative max-md:w-full">
      <PopupMenu>
        <PopupMenu.Button
          rightIcon={<ChevronDown />}
          variant="tertiary"
          showBackground={false}
          size="sm"
          className="max-md:w-full"
        >
          {label}
        </PopupMenu.Button>
        <PopupMenu.Panel className="max-md:w-full max-h-[70vh] overflow-y-auto">
        {searchable && (
          <SearchField
            size="md"
            value={query}
            placeholder="Skriv för att söka"
            onChange={(event) => {
              setQuery(event.target.value);
            }}
            onReset={() => {
              setQuery('');
            }}
          />
        )}
        <PopupMenu.Items autoFocus={false}>
          {visibleOptions.map((option) => (
            <PopupMenu.Item key={option.value}>
              <Checkbox
                labelPosition="left"
                checked={selected.includes(option.value)}
                onChange={(event) => {
                  toggle(option.value, event.target.checked);
                }}
              >
                {option.label}
              </Checkbox>
            </PopupMenu.Item>
          ))}
        </PopupMenu.Items>
      </PopupMenu.Panel>
      </PopupMenu>
    </div>
  );
};
