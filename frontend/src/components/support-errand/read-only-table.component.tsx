import { cx } from '@sk-web-gui/react';
import { FC, ReactNode } from 'react';

interface ReadOnlyTableProps {
  /** Column headings, in order. */
  columns: string[];
  /** One entry per row, with one cell per column. The first cell is emphasised as the row's label. */
  rows: ReactNode[][];
  /** Accessible name for the table (e.g. the question the table answers). */
  ariaLabel?: string;
}

/** A plain read-only data table for use inside a grey content box: bold header row and divided rows. */
export const ReadOnlyTable: FC<ReadOnlyTableProps> = ({ columns, rows, ariaLabel }) => (
  <div className="w-full overflow-x-auto">
    <table className="w-full border-collapse text-left" aria-label={ariaLabel}>
      <thead>
        <tr className="border-b-1 border-dark-primary">
          {columns.map((column) => (
            <th key={column} scope="col" className="px-16 py-16 text-small font-bold text-dark-secondary">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, rowIndex) => (
          <tr key={rowIndex} className="border-b-1 border-divider last:border-b-0">
            {cells.map((cell, cellIndex) => (
              <td
                key={cellIndex}
                className={cx('px-16 py-16 text-small text-dark-secondary break-words align-top', {
                  'font-bold': cellIndex === 0,
                })}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
