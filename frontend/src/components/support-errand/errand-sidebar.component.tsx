'use client';

import { Badge, Button, cx } from '@sk-web-gui/react';
import { ChevronsLeft, ChevronsRight, type LucideIcon } from 'lucide-react';
import { FC, ReactNode, useState } from 'react';

export interface SidebarSection {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Optional count shown as a badge on the section's icon (e.g. number of notes). */
  badge?: number;
  component: ReactNode;
}

/**
 * Collapsible right-edge sidebar for the errand view (draken look): a vertical icon rail selects a
 * section, whose panel is shown alongside. Built from @sk-web-gui/react, with no global-store
 * coupling — sections are passed in.
 */
export const ErrandSidebar: FC<{ sections: SidebarSection[] }> = ({ sections }) => {
  const [open, setOpen] = useState<boolean>(true);
  const [selected, setSelected] = useState<string | undefined>(sections[0]?.key);
  const active = sections.find((section) => section.key === selected) ?? sections[0];

  return (
    <aside
      data-cy="errand-sidebar"
      className={cx(
        'transition-all ease-in-out duration-150 flex bg-background-content h-full shrink-0',
        open ? 'w-full sm:w-[40rem] sm:min-w-[40rem]' : 'w-[5.6rem]'
      )}
    >
      <div
        role="menubar"
        aria-orientation="vertical"
        className="h-full flex flex-col justify-between border-1 border-y-0 border-divider min-w-[5.6rem]"
      >
        <div className="flex flex-col pt-18 lg:pt-32 gap-12 pb-12 items-center w-full px-8">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Button
                key={section.key}
                role="menuitem"
                aria-label={section.label}
                onClick={() => {
                  setSelected(section.key);
                  setOpen(true);
                }}
                color="primary"
                inverted={selected !== section.key}
                iconButton
                className="relative"
                leftIcon={<Icon />}
              >
                {section.badge ?
                  <Badge
                    className="absolute -top-10 -right-10"
                    rounded
                    inverted
                    color="vattjom"
                    size="sm"
                    counter={section.badge > 99 ? '99+' : section.badge}
                  />
                : null}
              </Button>
            );
          })}
        </div>
        <div className="flex pt-24 w-full justify-center pb-12">
          <Button
            color="primary"
            variant="tertiary"
            aria-label={open ? 'Stäng sidomeny' : 'Öppna sidomeny'}
            iconButton
            leftIcon={open ? <ChevronsRight /> : <ChevronsLeft />}
            onClick={() => {
              setOpen(!open);
            }}
          />
        </div>
      </div>

      <div className={cx('overflow-x-hidden overflow-y-auto', open ? 'w-full px-20' : 'w-0 px-0')}>
        <div className="h-fit w-full py-32">{open ? active?.component : null}</div>
      </div>
    </aside>
  );
};
