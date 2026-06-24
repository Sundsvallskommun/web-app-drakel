'use client';

import { ErrandNotification } from '@services/notification-service';
import { Button, Spinner } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { Check, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { FC } from 'react';

const SUBTYPE_LABELS: Record<string, string> = {
  MESSAGE: 'Nytt meddelande',
  DECISION: 'Nytt beslut',
  ATTACHMENT: 'Ny bilaga',
  ERRAND: 'Ärende uppdaterat',
  STAKEHOLDER: 'Intressent uppdaterad',
  PARAMETER: 'Parameter ändrad',
  SYSTEM: 'Systemhändelse',
};

const subTypeLabel = (subType?: string): string => (subType ? (SUBTYPE_LABELS[subType] ?? subType) : 'Notis');
const formatWhen = (created?: string): string => (created ? dayjs(created).format('YYYY-MM-DD HH:mm') : '');

interface NotificationsPanelProps {
  notifications: ErrandNotification[];
  isLoading: boolean;
  loadError: boolean;
  onAcknowledge: (notification: ErrandNotification) => void;
  onClose: () => void;
}

/** The notifications list shown inside the overview sidebar: "Nya" (unread) + "Tidigare" (read). */
export const NotificationsPanel: FC<NotificationsPanelProps> = ({
  notifications,
  isLoading,
  loadError,
  onAcknowledge,
  onClose,
}) => {
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const openErrand = (notification: ErrandNotification): void => {
    if (notification.errandId) {
      router.push(`/${locale}/arende/${encodeURIComponent(notification.errandId)}`);
    }
  };

  const unread = notifications.filter((notification) => !notification.acknowledged);
  const read = notifications.filter((notification) => notification.acknowledged);

  const renderItem = (notification: ErrandNotification, withAcknowledge: boolean) => (
    <li
      key={notification.id}
      className="rounded-12 border-1 border-divider bg-background-content p-12 flex flex-col gap-6"
    >
      <button
        type="button"
        className="text-left flex flex-col gap-2"
        onClick={() => {
          openErrand(notification);
        }}
      >
        <span className="font-bold text-small">{subTypeLabel(notification.subType)}</span>
        {notification.description ? <span className="text-small break-words">{notification.description}</span> : null}
        <span className="text-small text-dark-secondary">{formatWhen(notification.created)}</span>
      </button>
      {withAcknowledge ?
        <Button
          size="sm"
          variant="tertiary"
          className="self-start"
          leftIcon={<Check size={16} />}
          onClick={() => {
            onAcknowledge(notification);
          }}
        >
          Markera som läst
        </Button>
      : null}
    </li>
  );

  return (
    <div className="flex flex-col gap-12 h-full min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-h4-sm md:text-h4-md m-0">Notiser</h2>
        <Button size="sm" variant="tertiary" iconButton aria-label="Stäng notiser" leftIcon={<X />} onClick={onClose} />
      </div>

      {loadError && <p className="text-error-surface-primary m-0 text-small">Det gick inte att hämta notiser</p>}

      {isLoading ?
        <Spinner size={3} />
      : notifications.length === 0 ?
        <p className="m-0 text-small text-dark-secondary">Inga notiser.</p>
      : <div className="flex flex-col gap-16 overflow-y-auto min-h-0">
          {unread.length ?
            <section className="flex flex-col gap-8">
              <h3 className="text-small font-bold m-0">Nya</h3>
              <ul className="flex flex-col gap-8 m-0 p-0 list-none">{unread.map((item) => renderItem(item, true))}</ul>
            </section>
          : null}
          {read.length ?
            <section className="flex flex-col gap-8">
              <h3 className="text-small font-bold m-0">Tidigare</h3>
              <ul className="flex flex-col gap-8 m-0 p-0 list-none">{read.map((item) => renderItem(item, false))}</ul>
            </section>
          : null}
        </div>
      }
    </div>
  );
};
