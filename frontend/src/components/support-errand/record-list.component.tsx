import { Spinner } from '@sk-web-gui/react';
import { FC, ReactNode } from 'react';

interface RecordListProps {
  title: string;
  isLoading: boolean;
  isEmpty: boolean;
  emptyText: string;
  /** RecordCard items. */
  children: ReactNode;
}

/** A titled list of record cards (e.g. "Tillagda journalanteckningar") with loading and empty states. */
export const RecordList: FC<RecordListProps> = ({ title, isLoading, isEmpty, emptyText, children }) => (
  <section className="flex flex-col gap-16">
    <h3 className="text-large font-bold m-0">{title}</h3>
    {isLoading ?
      <Spinner size={4} />
    : isEmpty ?
      <p className="m-0 text-dark-secondary">{emptyText}</p>
    : <ul className="flex flex-col gap-16 m-0 p-0 list-none">{children}</ul>}
  </section>
);
