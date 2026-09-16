'use client';

import { NotificationsPanel } from '@components/support-errands/notifications-panel.component';
import { useErrandNotifications } from '@hooks/use-errand-notifications';
import { Badge, Button } from '@sk-web-gui/react';
import { Bell } from 'lucide-react';
import { FC, useState } from 'react';

/** Bell button for the dark app header; opens the handläggare's notifications in a drawer from the right. */
export const HeaderNotifications: FC = () => {
  const notifications = useErrandNotifications();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  return (
    <>
      <Button
        aria-label="Notiser"
        variant="tertiary"
        inverted
        showBackground={false}
        iconButton
        className="relative shrink-0"
        leftIcon={<Bell />}
        onClick={() => {
          setShowNotifications(true);
        }}
      >
        {notifications.unacknowledgedCount > 0 ?
          <Badge
            className="absolute -top-6 -right-6"
            rounded
            color="vattjom"
            size="sm"
            counter={notifications.unacknowledgedCount > 99 ? '99+' : notifications.unacknowledgedCount}
          />
        : null}
      </Button>

      {showNotifications ?
        <>
          <div
            className="fixed inset-0 z-20"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
            aria-hidden
            onClick={() => {
              setShowNotifications(false);
            }}
          />
          <aside
            aria-label="Notiser"
            className="fixed inset-y-0 right-0 z-30 flex w-full flex-col bg-background-content p-24 shadow-lg sm:w-[40rem]"
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
