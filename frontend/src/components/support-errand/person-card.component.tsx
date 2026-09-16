import { FC } from 'react';

interface PersonCardProps {
  name: string;
  /** Small secondary text above the name (e.g. the person's role). */
  role?: string;
  /** Detail lines (personnummer, adress, e-post …) laid out side by side as columns; empty lines are skipped. */
  detailColumns?: (string | undefined)[][];
}

/** A white card presenting one person: optional role, the name in bold and small detail lines in columns. */
export const PersonCard: FC<PersonCardProps> = ({ name, role, detailColumns = [] }) => {
  const visibleColumns = detailColumns
    .map((column) => column.filter((line): line is string => !!line && line.length > 0))
    .filter((column) => column.length > 0);

  return (
    <div className="bg-background-content rounded-12 px-16 pt-12 pb-16 flex flex-col gap-8">
      {role ?
        <span className="text-small text-dark-secondary">{role}</span>
      : null}
      <span className="font-bold break-words">{name}</span>
      {visibleColumns.length > 0 ?
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-small">
          {visibleColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-8 min-w-0">
              {column.map((line, lineIndex) => (
                <span key={lineIndex} className="break-words">
                  {line}
                </span>
              ))}
            </div>
          ))}
        </div>
      : null}
    </div>
  );
};
