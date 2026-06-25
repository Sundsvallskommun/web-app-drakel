'use client';

import { ERRAND_VIEWS, ErrandView } from '@components/support-errands/errand-views';
import { NotificationsPanel } from '@components/support-errands/notifications-panel.component';
import { useErrandNotifications } from '@hooks/use-errand-notifications';
import { useUserStore } from '@services/user-service/user-service';
import { Badge, Button, cx, Divider, Logo, UserMenu } from '@sk-web-gui/react';
import { getInitials } from '@utils/get-initials';
import {
  Bell,
  ChevronsLeft,
  ChevronsRight,
  CircleCheckBig,
  ClipboardPen,
  Inbox,
  LayoutList,
  type LucideIcon,
} from 'lucide-react';
import { FC, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { userMenuGroups } from './user-menu-groups';

/** Icon per overview view (Alla / Nya / Öppna / Avslutade). */
const VIEW_ICON: Record<ErrandView, LucideIcon> = {
  all: LayoutList,
  new: Inbox,
  open: ClipboardPen,
  closed: CircleCheckBig,
};

interface MainSidebarProps {
  selectedView: ErrandView;
  onSelectView: (view: ErrandView) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const MainSidebar: FC<MainSidebarProps> = ({ selectedView, onSelectView, open, setOpen }) => {
  const user = useUserStore(useShallow((state) => state.user));
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Drakel';
  const notifications = useErrandNotifications();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  return (
    <>
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

        <div className={cx('mb-24 items-center', open ? 'flex gap-12 justify-between' : 'flex flex-col gap-16')}>
          {open && (
            <div className="flex gap-12 items-center min-w-0">
              <UserMenu
                data-cy="avatar-aside"
                initials={getInitials(user.name)}
                menuTitle={`${user.name} (${user.username})`}
                menuGroups={userMenuGroups}
                buttonSize="md"
                buttonRounded={false}
                color="vattjom"
              />
              <span className="leading-tight font-bold truncate" data-cy="userinfo">
                {user.name}
              </span>
            </div>
          )}
          {/* Notis-knapp bredvid inloggad användare (samma placering som draken-public). */}
          <Button
            aria-label="Notiser"
            variant="tertiary"
            iconButton
            className="relative shrink-0"
            leftIcon={<Bell />}
            onClick={() => {
              setOpen(true);
              setShowNotifications(true);
            }}
          >
            {notifications.unacknowledgedCount > 0 ?
              <Badge
                className="absolute -top-10 -right-10"
                rounded
                color="vattjom"
                counter={notifications.unacknowledgedCount > 99 ? '99+' : notifications.unacknowledgedCount}
              />
            : null}
          </Button>
        </div>

        <Divider className={cx(!open && 'w-[4rem] mx-auto')} />

        <nav className={cx('flex flex-col gap-8 py-24', !open && 'items-center')} aria-label="Statusfilter">
          {ERRAND_VIEWS.map((item) => {
            const isActive = selectedView === item.key;
            const Icon = VIEW_ICON[item.key];
            return (
              <Button
                key={item.key}
                onClick={() => {
                  onSelectView(item.key);
                }}
                variant={isActive ? 'primary' : 'ghost'}
                className={cx('w-full', open && 'justify-start', !isActive && 'hover:bg-dark-ghost')}
                aria-label={`status-button-${item.key}`}
                leftIcon={<Icon />}
                iconButton={!open}
              >
                {open && <span className="truncate">{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        <div
          className={cx('absolute bottom-[2.4rem]', open ? 'right-[2.4rem]' : 'left-1/2 transform -translate-x-1/2')}
        >
          <Button
            color="primary"
            size="md"
            variant="tertiary"
            aria-label={open ? 'Stäng sidomeny' : 'Öppna sidomeny'}
            iconButton
            leftIcon={open ? <ChevronsLeft /> : <ChevronsRight />}
            onClick={() => {
              setOpen(!open);
            }}
          />
        </div>
      </div>

    </aside>

      {/* Notisvyn är en egen utfällbar sidebar bredvid huvudmenyn (som draken-public). */}
      {showNotifications ?
        <>
          <div
            className="fixed inset-0 z-20 sm:left-[32rem]"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            aria-hidden
            onClick={() => {
              setShowNotifications(false);
            }}
          />
          <aside
            aria-label="Notiser"
            className="fixed inset-y-0 left-0 z-30 flex w-full flex-col border-l-1 border-divider bg-background-content p-24 shadow-lg sm:left-[32rem] sm:w-[40rem] sm:max-w-[calc(100vw-32rem)]"
          >
            <NotificationsPanel
              notifications={notifications.notifications}
              isLoading={notifications.isLoading}
              loadError={!!notifications.error}
              onAcknowledge={(notification) => void notifications.acknowledge(notification)}
              onClose={() => {
                setShowNotifications(false);
              }}
            />
          </aside>
        </>
      : null}
    </>
  );
};
