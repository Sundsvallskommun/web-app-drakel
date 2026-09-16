import { FC, ReactNode } from 'react';

interface ErrandSectionHeaderProps {
  title: string;
  description?: ReactNode;
  /** Rendered to the right of the title (a button, or e.g. the section-approval checkbox). */
  action?: ReactNode;
  /** Rendered under the description (e.g. the "section is locked" banner). */
  children?: ReactNode;
}

/** The heading block at the top of an errand tab: title with an optional action, description and extras. */
export const ErrandSectionHeader: FC<ErrandSectionHeaderProps> = ({ title, description, action, children }) => (
  <div className="flex flex-col gap-16">
    <div className="flex items-center justify-between gap-24 flex-wrap">
      <h2 className="text-h3-md md:text-h3-lg m-0">{title}</h2>
      {action}
    </div>
    {description ?
      <p className="m-0 text-dark-secondary max-w-[68rem]">{description}</p>
    : null}
    {children}
  </div>
);
