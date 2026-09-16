import { cx } from '@sk-web-gui/react';
import { FC, ReactNode } from 'react';

interface ContentBoxProps {
  title?: string;
  /** Rendered to the right of the title (e.g. a "Förhandsgranska" button). */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** A light grey group box used to cluster related fields, answers or tables inside an errand tab. */
export const ContentBox: FC<ContentBoxProps> = ({ title, action, className, children }) => (
  <section className={cx('bg-background-color-mixin-1 rounded-8 p-20 flex flex-col gap-24', className)}>
    {title || action ?
      <div className="flex items-center justify-between gap-16 flex-wrap">
        {title ?
          <h3 className="text-lead font-bold m-0">{title}</h3>
        : null}
        {action}
      </div>
    : null}
    {children}
  </section>
);
