'use client';

import { Button, cx } from '@sk-web-gui/react';
import { ChevronsLeft, ChevronsRight, CircleCheckBig, FilePen, Files, LucideIcon, Search } from 'lucide-react';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { ERRAND_VIEWS, ErrandView } from './errand-views';

/** Icon per overview view (Alla / Pågående / Avslutade / Sök). */
const VIEW_ICON: Record<ErrandView, LucideIcon> = {
  all: Files,
  ongoing: FilePen,
  closed: CircleCheckBig,
  search: Search,
};

interface OverviewSidebarProps {
  selectedView: ErrandView;
  onSelectView: (view: ErrandView) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The overview's left navigation: the "Ärenden" section with one item per status view, and a collapse toggle
 * that shrinks it to an icon rail.
 */
export const OverviewSidebar: FC<OverviewSidebarProps> = ({ selectedView, onSelectView, open, onOpenChange }) => {
  const { t } = useTranslation('overview');

  return (
    <aside
      data-cy="overview-aside"
      className={cx(
        'shrink-0 h-full overflow-y-auto bg-background-100 border-r-1 border-divider flex flex-col gap-24 transition-all ease-in-out duration-150',
        open ? 'w-[32rem] p-24' : 'w-[8.8rem] px-16 py-24'
      )}
    >
      <nav className="flex flex-1 flex-col gap-16" aria-label={t('sidebar.heading')}>
        {open ?
          <h2 className="m-0 text-small font-bold text-dark-secondary">{t('sidebar.heading')}</h2>
        : null}
        <ul className="m-0 p-0 list-none flex flex-col gap-8">
          {ERRAND_VIEWS.map((view) => {
            const Icon = VIEW_ICON[view];
            const isActive = selectedView === view;
            const label = t(`views.${view}`);
            return (
              // Sök is not a list of the handläggare's own errands, so it is set apart from the three
              // that are.
              <li key={view} className={view === 'search' ? 'pt-8 mt-8 border-t-1 border-divider' : undefined}>
                <button
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={open ? undefined : label}
                  title={open ? undefined : label}
                  className={cx(
                    'w-full flex items-center gap-10 rounded-12 px-12 py-10 text-left transition-colors',
                    open ? 'justify-start' : 'justify-center',
                    isActive ?
                      'bg-vattjom-background-200 text-vattjom-text-primary font-bold'
                    : 'text-dark-secondary hover:bg-background-color-mixin-1'
                  )}
                  onClick={() => {
                    onSelectView(view);
                  }}
                >
                  <Icon size={24} className="shrink-0" aria-hidden />
                  {open ?
                    <span className="truncate">{label}</span>
                  : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={cx('flex', open ? 'justify-end' : 'justify-center')}>
        <Button
          variant="tertiary"
          iconButton
          aria-label={open ? t('sidebar.closeMenu') : t('sidebar.openMenu')}
          leftIcon={open ? <ChevronsLeft /> : <ChevronsRight />}
          onClick={() => {
            onOpenChange(!open);
          }}
        />
      </div>
    </aside>
  );
};
