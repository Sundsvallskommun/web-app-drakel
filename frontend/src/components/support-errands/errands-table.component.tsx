'use client';

import { Errand } from '@data-contracts/backend/data-contracts';
import { Pagination, Spinner, Table } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { useParams, useRouter } from 'next/navigation';
import { FC } from 'react';

import { ErrandStatusLabel } from './errand-status-label.component';
import { PriorityLabel } from './priority-label.component';

interface ErrandsTableProps {
  errands: Errand[];
  isLoading: boolean;
  error?: number | string | boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

interface Column {
  label: string;
  render: (errand: Errand) => React.ReactNode;
}

const formatDate = (value?: string): string => (value ? dayjs(value).format('YYYY-MM-DD, HH:mm') : '');
const errandRouteSegment = (errand: Errand): string | undefined => errand.errandNumber ?? errand.id;

const columns: Column[] = [
  { label: 'Status', render: (errand) => <ErrandStatusLabel status={errand.status} /> },
  {
    label: 'Senaste aktivitet',
    render: (errand) => {
      const touched = errand.touched ?? errand.modified;
      return (
        <div className="whitespace-nowrap">
          <time dateTime={touched}>{formatDate(touched)}</time>
          <div className="italic text-small">Ärendet uppdaterades</div>
        </div>
      );
    },
  },
  {
    label: 'Ärende',
    render: (errand) => (
      <div className="max-w-[280px]">
        <div className="font-bold truncate">{errand.title ?? '(utan titel)'}</div>
        <div className="text-small text-secondary truncate">{errand.errandNumber ?? '—'}</div>
      </div>
    ),
  },
  { label: 'Kategori', render: (errand) => errand.category ?? '—' },
  { label: 'Typ', render: (errand) => errand.type ?? '—' },
  {
    label: 'Registrerad',
    render: (errand) => (
      <div className="whitespace-nowrap">
        <time dateTime={errand.created}>{formatDate(errand.created)}</time>
        <div className="italic text-small">{errand.reporterUserId ?? ''}</div>
      </div>
    ),
  },
  { label: 'Prioritet', render: (errand) => <PriorityLabel priority={errand.priority} /> },
];

export const ErrandsTable: FC<ErrandsTableProps> = ({ errands, isLoading, error, page, totalPages, onPageChange }) => {
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
              {columns.map((column, index) => (
                <Table.HeaderColumn key={`header-${index}`}>{column.label}</Table.HeaderColumn>
              ))}
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

        {totalPages > 1 && (
          <Table.Footer>
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
          </Table.Footer>
        )}
      </Table>
    </div>
  );
};
