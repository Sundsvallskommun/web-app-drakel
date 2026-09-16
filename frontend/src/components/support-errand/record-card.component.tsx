import { formatShortDateTime } from '@utils/format-short-date-time';
import { FC, ReactNode } from 'react';

interface RecordCardProps {
  heading?: string;
  /** ISO date-time shown to the right, e.g. "12 aug, 12:12". */
  dateTime?: string;
  /** Badges next to the heading (status, "Från Lifecare"). */
  badges?: ReactNode;
  /** Rendered at the far right of the heading row, typically a RecordActionsMenu. */
  menu?: ReactNode;
  children?: ReactNode;
}

/** A grey card in a record list (journal entries, documents): heading, badges, date and "…" menu, then content. */
export const RecordCard: FC<RecordCardProps> = ({ heading, dateTime, badges, menu, children }) => (
  <li className="bg-background-color-mixin-1 rounded-8 p-20 flex flex-col gap-8">
    <div className="flex items-start justify-between gap-16">
      <div className="flex items-center gap-8 flex-wrap min-w-0 min-h-32">
        <h4 className="m-0 text-label-medium font-bold text-dark-secondary break-words">{heading}</h4>
        {badges}
      </div>
      <div className="flex shrink-0 items-center gap-16 min-h-32">
        <span className="text-small text-dark-secondary">{formatShortDateTime(dateTime)}</span>
        {menu}
      </div>
    </div>
    <div className="flex flex-col gap-8 text-dark-secondary">{children}</div>
  </li>
);

/** A "Label: value" line in a record card, e.g. "Tillagd av: Förnamn Efternamn"; hidden without a value. */
export const RecordCardDetail: FC<{ label: string; value?: string }> = ({ label, value }) =>
  value ?
    <p className="m-0 break-words">
      {label}: {value}
    </p>
  : null;
