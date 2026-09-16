import { cx } from '@sk-web-gui/react';
import { FC } from 'react';

interface RecordStatusBadgeProps {
  status?: 'WORKING' | 'LOCKED';
  /** Label for an editable (WORKING) record, e.g. "Arbetsanteckning" or "Utkast". */
  workingLabel: string;
}

/** Status badge for a journal entry or document: the working label, or "Upprättad" once locked. */
export const RecordStatusBadge: FC<RecordStatusBadgeProps> = ({ status, workingLabel }) => {
  const isLocked = status === 'LOCKED';
  return (
    <span
      className={cx(
        'shrink-0 text-small rounded-8 px-8 py-2',
        isLocked ? 'bg-success-background-100 text-success-surface-primary' : 'bg-gray-100 text-gray-600'
      )}
    >
      {isLocked ? 'Upprättad' : workingLabel}
    </span>
  );
};
