'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { Button, Pagination, Select, Spinner, Table } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { TFunction } from 'i18next';
import { ArrowRight, ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { ErrandStatusLabel } from './errand-status-label.component';

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

interface ColumnRenderContext {
  assigneeName: (assignedUserId: string) => string;
  t: TFunction;
}

interface Column {
  /** Translation key (in the `overview` namespace) of the header label. */
  labelKey: string;
  render: (errand: Errand, context: ColumnRenderContext) => React.ReactNode;
  /** When set, the header is a button that toggles server-side sorting on this field. */
  sortKey?: string;
}

const formatDate = (value?: string): string => (value ? dayjs(value).format('YYYY-MM-DD, HH:mm') : '');
const errandRouteSegment = (errand: Errand): string | undefined => errand.errandNumber ?? errand.id;

const columns: Column[] = [
  {
    labelKey: 'table.columns.status',
    sortKey: 'status',
    render: (errand) => <ErrandStatusLabel status={errand.status} />,
  },
  {
    labelKey: 'table.columns.errand',
    sortKey: 'errandNumber',
    render: (errand, { t }) => (
      <div className="leading-tight">
        <div className="font-bold break-words">{errand.title ?? t('table.untitled')}</div>
        <div className="break-words">{errand.errandNumber ?? t('common:none')}</div>
      </div>
    ),
  },
  {
    labelKey: 'table.columns.applicant',
    sortKey: 'applicantName',
    render: (errand, { t }) => (
      <div className="leading-tight">
        <div className="break-words">{errand.applicantName ?? t('common:none')}</div>
        {errand.coApplicantName ?
          <div className="break-words text-small text-dark-secondary">
            <span className="sr-only">{t('common:role.CO_APPLICANT')}: </span>
            {errand.coApplicantName}
          </div>
        : null}
      </div>
    ),
  },
  {
    labelKey: 'table.columns.created',
    sortKey: 'created',
    render: (errand) => (
      <time className="whitespace-nowrap" dateTime={errand.created}>
        {formatDate(errand.created)}
      </time>
    ),
  },
  {
    labelKey: 'table.columns.assignee',
    sortKey: 'assignedUserId',
    render: (errand, { assigneeName, t }) => (
      <div className="max-w-[22rem] truncate">
        {errand.assignedUserId ? assigneeName(errand.assignedUserId) : t('table.unassigned')}
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
  const { t } = useTranslation('overview');
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
            {t('table.loadError', { error: String(error) })}
          </caption>
        : !isLoading && errands.length === 0 ?
          <caption id="errandTableCaption" className="my-32">
            {t('table.empty')}
          </caption>
        : <caption id="errandTableCaption" className="sr-only">
            {t('table.caption', { page: page + 1, totalPages: Math.max(totalPages, 1) })}
          </caption>
        }

        {errands.length > 0 && (
          <>
            <Table.Header className="border-b-1 border-dark-primary">
              {columns.map((column, index) => {
                const sortKey = column.sortKey;
                const label = t(column.labelKey);
                return (
                  <Table.HeaderColumn key={`header-${index}`}>
                    {sortKey && onSort ?
                      <button
                        type="button"
                        className="flex items-center gap-4 font-bold"
                        aria-label={t('table.sortBy', { column: label })}
                        onClick={() => {
                          onSort(sortKey);
                        }}
                      >
                        {label}
                        <SortIndicator active={sortColumn === sortKey} direction={sortDirection} />
                      </button>
                    : label}
                  </Table.HeaderColumn>
                );
              })}
              <Table.HeaderColumn>
                <span className="sr-only">{t('table.open')}</span>
              </Table.HeaderColumn>
            </Table.Header>
            <Table.Body>
              {errands.map((errand) => (
                <Table.Row
                  key={errand.id}
                  tabIndex={0}
                  role="button"
                  aria-label={t('table.rowLabel', {
                    title: errand.title ?? errand.errandNumber ?? t('table.rowLabelUntitled'),
                  })}
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
                    <Table.Column key={`cell-${index}`}>{column.render(errand, { assigneeName, t })}</Table.Column>
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
                  {t('table.pageSize')}
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
                      {t('table.pageSizeOption', { size: option })}
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
