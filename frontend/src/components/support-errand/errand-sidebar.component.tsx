'use client';

import { usePublishedWidth } from '@hooks/use-published-width';
import { Badge, Button, Divider } from '@sk-web-gui/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { FC, Fragment, ReactNode, useRef } from 'react';
import { useTranslation } from 'react-i18next';

export interface SidebarSection {
  key: string;
  label: string;
  /** Optional count shown as a badge next to the section title (e.g. number of notes). */
  badge?: number;
  /** The badge colour — used to make a count that needs attention stand out. Defaults to tertiary. */
  badgeColor?: 'tertiary' | 'warning' | 'error';
  component: ReactNode;
}

const SidebarAccordionItem: FC<{ section: SidebarSection; open: boolean; onToggle: () => void }> = ({
  section,
  open,
  onToggle,
}) => {
  const { t } = useTranslation('sidebar');
  const contentId = `errand-sidebar-${section.key}`;
  return (
    <div className="px-20 flex flex-col gap-24">
      <div className="flex items-center gap-16 py-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={onToggle}
          className="flex flex-1 items-center gap-8 min-w-0 text-left"
        >
          <h2 className="text-h4-sm m-0 truncate">{section.label}</h2>
          {section.badge !== undefined ?
            <Badge
              color={section.badgeColor ?? 'tertiary'}
              inverted
              size="sm"
              counter={section.badge > 99 ? '99+' : section.badge}
            />
          : null}
        </button>
        <Button
          variant="tertiary"
          showBackground={false}
          size="sm"
          iconButton
          aria-label={
            open ? t('toggle.close', { section: section.label }) : t('toggle.open', { section: section.label })
          }
          aria-expanded={open}
          aria-controls={contentId}
          leftIcon={open ? <ChevronUp /> : <ChevronDown />}
          onClick={onToggle}
        />
      </div>
      {open ?
        <div id={contentId}>{section.component}</div>
      : null}
    </div>
  );
};

/**
 * Right-hand column of the errand view: a stack of accordion sections (Varningar, Anteckningar, …). The open
 * sections are controlled by the parent so it can lazy-load each section's data only once it's opened.
 * Its width is published as `--errand-sidebar-width`, where the SSBTEK panel at the foot of the page stops.
 */
export const ErrandSidebar: FC<{
  sections: SidebarSection[];
  openKeys: string[];
  onToggle: (key: string) => void;
}> = ({ sections, openKeys, onToggle }) => {
  const asideRef = useRef<HTMLElement>(null);
  usePublishedWidth(asideRef, '--errand-sidebar-width');
  return (
    <aside
      ref={asideRef}
      data-cy="errand-sidebar"
      className="shrink-0 w-full lg:w-[36rem] xl:w-[44rem] h-full overflow-y-auto bg-background-content border-l-1 border-divider pt-24 pb-32 flex flex-col gap-24"
    >
      {sections.map((section, index) => (
        <Fragment key={section.key}>
          {index > 0 ?
            // sk Divider grows by default (flex-1), which would stretch it in this flex column.
            <Divider className="grow-0" />
          : null}
          <SidebarAccordionItem
            section={section}
            open={openKeys.includes(section.key)}
            onToggle={() => {
              onToggle(section.key);
            }}
          />
        </Fragment>
      ))}
    </aside>
  );
};
