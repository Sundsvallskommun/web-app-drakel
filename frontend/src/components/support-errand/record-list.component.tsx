import { AsyncContent } from '@components/common/async-content.component';
import { FC, ReactNode } from 'react';

interface RecordListProps {
  title: string;
  isLoading: boolean;
  /** Truthy when loading failed; shows `errorText` instead of the list. */
  error?: unknown;
  errorText: string;
  isEmpty: boolean;
  emptyText: string;
  /** RecordCard items. */
  children: ReactNode;
}

/** A titled list of record cards (e.g. "Tillagda journalanteckningar") with loading, error and empty states. */
export const RecordList: FC<RecordListProps> = ({
  title,
  isLoading,
  error,
  errorText,
  isEmpty,
  emptyText,
  children,
}) => (
  <section className="flex flex-col gap-16">
    <h3 className="text-large font-bold m-0">{title}</h3>
    <AsyncContent isLoading={isLoading} error={error} errorText={errorText} isEmpty={isEmpty} emptyText={emptyText}>
      <ul className="flex flex-col gap-16 m-0 p-0 list-none">{children}</ul>
    </AsyncContent>
  </section>
);
