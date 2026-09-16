import { cx } from '@sk-web-gui/react';
import { FC, ReactNode } from 'react';

interface LabeledValueProps {
  label: string;
  className?: string;
  /** The read-only value shown under the label. */
  children: ReactNode;
}

/** A read-only "label + value" pair (e.g. "Avser ansökan / Juni 2026") shown alongside form fields. */
export const LabeledValue: FC<LabeledValueProps> = ({ label, className, children }) => (
  <div className={cx('flex flex-col gap-8', className)}>
    <span className="text-label-medium font-bold">{label}</span>
    <span>{children}</span>
  </div>
);
