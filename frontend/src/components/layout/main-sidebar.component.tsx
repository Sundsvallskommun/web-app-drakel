'use client';

import { Lookup } from '@data-contracts/backend/data-contracts';
import { useUserStore } from '@services/user-service/user-service';
import { getInitials } from '@utils/get-initials';
import { Badge, Button, cx, Divider, Logo, UserMenu } from '@sk-web-gui/react';
import {
  ChevronsLeft,
  ChevronsRight,
  CircleCheckBig,
  CircleDot,
  CirclePause,
  ClipboardPen,
  FilePlus,
  Inbox,
  LayoutList,
  type LucideIcon,
} from 'lucide-react';
import { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { userMenuGroups } from './user-menu-groups';

/** Picks an icon for a status nav item. Statuses are namespace-defined, so we map common intents
 *  and fall back to a neutral dot. The "all" item (null key) gets a list icon. */
const statusIcon = (key: string | null): LucideIcon => {
  if (key === null) {
    return LayoutList;
  }
  switch (key.toUpperCase()) {
    case 'NEW':
    case 'NYA':
      return Inbox;
    case 'ONGOING':
    case 'UNDER_ARBETE':
      return ClipboardPen;
    case 'PENDING':
    case 'SUSPENDED':
    case 'AWAITING':
      return CirclePause;
    case 'ASSIGNED':
      return FilePlus;
    case 'SOLVED':
    case 'CLOSED':
    case 'AVSLUTAD':
      return CircleCheckBig;
    default:
      return CircleDot;
  }
};

interface StatusNavItem {
  key: string | null;
  label: string;
  count: number;
}

interface MainSidebarProps {
  statuses: Lookup[];
  counts: Record<string, number>;
  totalCount: number;
  selectedStatus: string | null;
  onSelectStatus: (status: string | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const MainSidebar: FC<MainSidebarProps> = ({
  statuses,
  counts,
  totalCount,
  selectedStatus,
  onSelectStatus,
  open,
  setOpen,
}) => {
  const user = useUserStore(useShallow((state) => state.user));
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Drakel';

  const items: StatusNavItem[] = [
    { key: null, label: 'Alla ärenden', count: totalCount },
    ...statuses.map((status) => ({
      key: status.name ?? '',
      label: status.displayName || status.name || '',
      count: counts[status.name ?? ''] ?? 0,
    })),
  ];

  return (
    <aside
      data-cy="overview-aside"
      className={cx(
        'fixed left-0 top-0 transition-all ease-in-out duration-150 flex z-10 bg-vattjom-background-200 min-h-screen',
        open ? 'sm:w-[32rem] sm:min-w-[32rem] max-lg:shadow-100' : 'w-[5.6rem]'
      )}
    >
      <div className={cx('h-full w-full', open ? 'p-24' : 'py-24')}>
        <div className={cx('mb-24', open ? '' : 'flex justify-center')}>
          <Logo
            variant={open ? 'service' : 'symbol'}
            title="Drakel"
            subtitle={open ? appName : undefined}
            className={cx(!open && 'w-[2.8rem]')}
          />
        </div>

        {open && (
          <div className="flex gap-12 items-center mb-24">
            <UserMenu
              data-cy="avatar-aside"
              initials={getInitials(user.name)}
              menuTitle={`${user.name} (${user.username})`}
              menuGroups={userMenuGroups}
              buttonSize="md"
              buttonRounded={false}
              color="vattjom"
            />
            <span className="leading-tight font-bold" data-cy="userinfo">
              {user.name}
            </span>
          </div>
        )}

        <Divider className={cx(!open && 'w-[4rem] mx-auto')} />

        <nav className={cx('flex flex-col gap-8 py-24', !open && 'items-center')} aria-label="Statusfilter">
          {items.map((item) => {
            const isActive = selectedStatus === item.key;
            const Icon = statusIcon(item.key);
            return (
              <Button
                key={item.key ?? 'all'}
                onClick={() => onSelectStatus(item.key)}
                variant={isActive ? 'primary' : 'ghost'}
                className={cx('w-full', open && 'justify-start', !isActive && 'hover:bg-dark-ghost')}
                aria-label={`status-button-${item.key ?? 'all'}`}
                leftIcon={<Icon />}
                iconButton={!open}
              >
                {open && (
                  <span className="w-full flex justify-between items-center gap-8">
                    <span className="truncate">{item.label}</span>
                    <Badge
                      className="min-w-fit px-4"
                      inverted={!isActive}
                      color={isActive ? 'tertiary' : 'vattjom'}
                      counter={item.count > 999 ? '999+' : item.count}
                    />
                  </span>
                )}
              </Button>
            );
          })}
        </nav>

        <div className={cx('absolute bottom-[2.4rem]', open ? 'right-[2.4rem]' : 'left-1/2 transform -translate-x-1/2')}>
          <Button
            color="primary"
            size="md"
            variant="tertiary"
            aria-label={open ? 'Stäng sidomeny' : 'Öppna sidomeny'}
            iconButton
            leftIcon={open ? <ChevronsLeft /> : <ChevronsRight />}
            onClick={() => setOpen(!open)}
          />
        </div>
      </div>
    </aside>
  );
};
