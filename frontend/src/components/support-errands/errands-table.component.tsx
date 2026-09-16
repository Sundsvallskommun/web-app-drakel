'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { Button, Pagination, Select, Spinner, Table } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { ArrowRight, ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { FC } from 'react';

import { ErrandStatusLabel } from './errand-status-label.component';
import { PriorityLabel } from './priority-label.component';

export type SortDirection = 'asc' | 'desc';

/** Selectable page sizes for the "rader per sida" control (the first is the default). */
const PAGE_SIZE_OPTIONS = [12, 25, 50, 100];

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
  /** Display name for a handläggare username. */
  assigneeName: (assignedUserId: string) => string;
}

interface Column {
  label: string;
  render: (errand: Errand, assigneeName: (assignedUserId: string) => string) => React.ReactNode;
  /** When set, the header is a button that toggles server-side sorting on this field. */
  sortKey?: string;
}

const formatDate = (value?: string): string => (value ? dayjs(value).format('YYYY-MM-DD, HH:mm') : '');
const errandRouteSegment = (errand: Errand): string | undefined => errand.errandNumber ?? errand.id;

const columns: Column[] = [
  { label: 'Status', sortKey: 'status', render: (errand) => <ErrandStatusLabel status={errand.status} /> },
  {
    label: 'Ärende',
    sortKey: 'errandNumber',
    render: (errand) => (
      <div className="max-w-[24rem] desktop:max-w-[40rem] leading-tight">
        <div className="font-bold truncate">{errand.title ?? '(utan titel)'}</div>
        <div className="truncate">{errand.errandNumber ?? '—'}</div>
      </div>
    ),
  },
  {
    label: 'Sökande',
    sortKey: 'applicantName',
    render: (errand) => (
      <div className="max-w-[22rem] leading-tight">
        <div className="truncate">{errand.applicantName ?? '—'}</div>
        {errand.coApplicantName ?
          <div className="truncate text-small text-dark-secondary" title={errand.coApplicantName}>
            <span className="sr-only">Medsökande: </span>
            {errand.coApplicantName}
          </div>
        : null}
      </div>
    ),
  },
  { label: 'Prioritet', sortKey: 'priority', render: (errand) => <PriorityLabel priority={errand.priority} /> },
  {
    label: 'Registrerat',
    sortKey: 'created',
    render: (errand) => (
      <time className="whitespace-nowrap" dateTime={errand.created}>
        {formatDate(errand.created)}
      </time>
    ),
  },
  {
    label: 'Uppdaterat',
    sortKey: 'touched',
    render: (errand) => {
      const touched = errand.touched ?? errand.modified;
      return (
        <time className="whitespace-nowrap" dateTime={touched}>
          {formatDate(touched)}
        </time>
      );
    },
  },
  {
    label: 'Handläggare',
    sortKey: 'assignedUserId',
    render: (errand, assigneeName) => (
      <div className="max-w-[22rem] truncate">
        {errand.assignedUserId ? assigneeName(errand.assignedUserId) : 'Ej tilldelad'}
      </div>
    ),
  },
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
  assigneeName,
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
    <div className="max-w-full relative overflow-x-hidden">
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
            <Table.Header className="border-b-1 border-dark-primary">
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
              <Table.HeaderColumn>
                <span className="sr-only">Öppna</span>
              </Table.HeaderColumn>
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
                    <Table.Column key={`cell-${index}`}>{column.render(errand, assigneeName)}</Table.Column>
                  ))}
                  <Table.Column className="text-right">
                    {/* The whole row opens the errand; the arrow is the visible affordance for it. */}
                    <Button
                      variant="tertiary"
                      size="sm"
                      iconButton
                      tabIndex={-1}
                      aria-hidden
                      leftIcon={<ArrowRight />}
                      onClick={(event) => {
                        event.stopPropagation();
                        openErrand(errand);
                      }}
                    />
                  </Table.Column>
                </Table.Row>
              ))}
            </Table.Body>
          </>
        )}

        {errands.length > 0 && (
          <Table.Footer>
            {/* 3-kolumns grid så pagineringen (mittkolumnen) centreras oavsett "Rader per sida"-bredden. */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-16 w-full">
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
                      {option} st
                    </Select.Option>
                  ))}
                </Select>
              </div>
              {totalPages > 1 ?
                <div className="justify-self-center">
                  <Pagination
                    pagesBefore={1}
                    pagesAfter={1}
                    pages={totalPages}
                    activePage={page + 1}
                    changePage={(nextPage) => {
                      onPageChange(nextPage - 1);
                    }}
                  />
                </div>
              : <div />}
              <div />
            </div>
          </Table.Footer>
        )}
      </Table>
    </div>
  );
};
