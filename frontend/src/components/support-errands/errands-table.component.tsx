'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { Pagination, Select, Spinner, Table } from '@sk-web-gui/react';
import { prettyTime } from '@utils/pretty-time';
import dayjs from 'dayjs';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { FC } from 'react';

export type SortDirection = 'asc' | 'desc';

/** Selectable page sizes for the "rader per sida" control (the first is the default). */
export const PAGE_SIZE_OPTIONS = [12, 25, 50, 100];

import { ErrandStatusLabel } from './errand-status-label.component';
import { PriorityLabel } from './priority-label.component';

interface ErrandsTableProps {
  errands: Errand[];
  isLoading: boolean;
  error?: number | string | boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Rows per page (server `size`) and its setter — drives the "rader per sida" control. */
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  /** The currently active server-side sort column (a column's `sortKey`), or undefined for the default order. */
  sortColumn?: string;
  sortDirection?: SortDirection;
  /** Toggle the server-side sort for a sortable column. */
  onSort?: (sortKey: string) => void;
}

interface Column {
  label: string;
  render: (errand: Errand) => React.ReactNode;
  /** When set, the header is a button that toggles server-side sorting on this field. */
  sortKey?: string;
}

const formatDate = (value?: string): string => (value ? dayjs(value).format('YYYY-MM-DD, HH:mm') : '');
const errandRouteSegment = (errand: Errand): string | undefined => errand.errandNumber ?? errand.id;

const columns: Column[] = [
  { label: 'Status', sortKey: 'status', render: (errand) => <ErrandStatusLabel status={errand.status} /> },
  {
    label: 'Senaste aktivitet',
    sortKey: 'touched',
    render: (errand) => {
      const touched = errand.touched ?? errand.modified;
      return (
        <div className="whitespace-nowrap">
          <time dateTime={touched}>{prettyTime(touched)}</time>
          <div className="italic text-small">Ärendet uppdaterades</div>
        </div>
      );
    },
  },
  {
    label: 'Ärende',
    sortKey: 'errandNumber',
    render: (errand) => (
      <div className="max-w-[280px]">
        <div className="font-bold truncate">{errand.title ?? '(utan titel)'}</div>
        <div className="text-small text-secondary truncate">{errand.errandNumber ?? '—'}</div>
      </div>
    ),
  },
  {
    label: 'Inskickat',
    sortKey: 'created',
    render: (errand) => (
      <div className="whitespace-nowrap">
        <time dateTime={errand.created}>{formatDate(errand.created)}</time>
      </div>
    ),
  },
  {
    label: 'Sökande',
    sortKey: 'applicantName',
    render: (errand) => <div className="max-w-[220px] truncate">{errand.applicantName ?? '—'}</div>,
  },
  { label: 'Prioritet', sortKey: 'priority', render: (errand) => <PriorityLabel priority={errand.priority} /> },
];

/** Sort affordance shown in a sortable column header: inactive (both arrows) or the active direction. */
const SortIndicator: FC<{ active: boolean; direction?: SortDirection }> = ({ active, direction }) => {
  if (!active) {
    return <ChevronsUpDown size={14} className="opacity-40" aria-hidden />;
  }
  return direction === 'asc' ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />;
};

export const ErrandsTable: FC<ErrandsTableProps> = ({
  errands,
  isLoading,
  error,
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const openErrand = (errand: Errand) => {
    const routeSegment = errandRouteSegment(errand);
    if (routeSegment) {
      router.push(`/${locale}/arende/${encodeURIComponent(routeSegment)}`);
    }
  };

  return (
    <div className="max-w-full relative">
      {isLoading && (
        <div className="z-10 absolute bg-background-content opacity-50 w-full h-full flex items-center justify-center">
          <Spinner size={5} />
        </div>
      )}
      <Table data-cy="errands-table" aria-describedby="errandTableCaption" scrollable>
        {error ?
          <caption id="errandTableCaption" className="my-32">
            Det gick inte att hämta ärenden ({String(error)})
          </caption>
        : !isLoading && errands.length === 0 ?
          <caption id="errandTableCaption" className="my-32">
            Det finns inga ärenden
          </caption>
        : <caption id="errandTableCaption" className="sr-only">
            Ärenden, sida {page + 1} av {Math.max(totalPages, 1)}
          </caption>
        }

        {errands.length > 0 && (
          <>
            <Table.Header>
              {columns.map((column, index) => {
                const sortKey = column.sortKey;
                return (
                  <Table.HeaderColumn key={`header-${index}`}>
                    {sortKey && onSort ?
                      <button
                        type="button"
                        className="flex items-center gap-4 font-bold"
                        aria-label={`Sortera på ${column.label}`}
                        onClick={() => {
                          onSort(sortKey);
                        }}
                      >
                        {column.label}
                        <SortIndicator active={sortColumn === sortKey} direction={sortDirection} />
                      </button>
                    : column.label}
                  </Table.HeaderColumn>
                );
              })}
            </Table.Header>
            <Table.Body>
              {errands.map((errand) => (
                <Table.Row
                  key={errand.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ärende ${errand.title ?? errand.errandNumber ?? 'utan titel'}, öppna ärende`}
                  className="cursor-pointer"
                  onClick={() => {
                    openErrand(errand);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      openErrand(errand);
                    }
                  }}
                >
                  {columns.map((column, index) => (
                    <Table.Column key={`cell-${index}`}>{column.render(errand)}</Table.Column>
                  ))}
                </Table.Row>
              ))}
            </Table.Body>
          </>
        )}

        {errands.length > 0 && (
          <Table.Footer>
            <div className="flex flex-wrap items-center justify-between gap-16 w-full">
              <div className="flex items-center gap-8">
                <label htmlFor="errand-page-size" className="text-small whitespace-nowrap">
                  Rader per sida:
                </label>
                <Select
                  id="errand-page-size"
                  size="sm"
                  value={String(pageSize)}
                  onChange={(event) => {
                    onPageSizeChange(Number(event.target.value));
                  }}
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <Select.Option key={option} value={String(option)}>
                      {option}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              {totalPages > 1 && (
                <div className="sk-table-paginationwrapper">
                  <Pagination
                    showFirst
                    showLast
                    pagesBefore={1}
                    pagesAfter={1}
                    fitContainer
                    pages={totalPages}
                    activePage={page + 1}
                    changePage={(nextPage) => {
                      onPageChange(nextPage - 1);
                    }}
                  />
                </div>
              )}
            </div>
          </Table.Footer>
        )}
      </Table>
    </div>
  );
};
