'use client';

import { AsyncContent } from '@components/common/async-content.component';
import { ErrandNotification } from '@services/notification-service';
import { Button } from '@sk-web-gui/react';
import dayjs from 'dayjs';
import { TFunction } from 'i18next';
import { Check, CheckCheck, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

/** The notification's title from its sub type (e.g. MESSAGE → "Nytt meddelande"); unknown sub types are shown as-is. */
const subTypeLabel = (subType: string | undefined, t: TFunction): string =>
  subType ?
    t(`overview:notifications.subTypes.${subType}`, { defaultValue: subType })
  : t('overview:notifications.fallbackTitle');
const formatWhen = (created?: string): string => (created ? dayjs(created).format('YYYY-MM-DD HH:mm') : '');

interface NotificationsPanelProps {
  notifications: ErrandNotification[];
  isLoading: boolean;
  loadError: boolean;
  onAcknowledge: (notification: ErrandNotification) => void;
  onMarkHandled: (notification: ErrandNotification) => void;
  onClose: () => void;
}

/**
 * The notifications list shown inside the overview sidebar, in the three states a notification moves
 * through: "Nya" (not yet seen), "Lästa" (seen but not acted on) and "Hanterade" (done with).
 *
 * The middle group is the point of the split: a notification read in passing used to disappear from view
 * although nobody had done anything about it. Marking one handled also marks it read, so the two buttons
 * are only both offered while it is new.
 */
export const NotificationsPanel: FC<NotificationsPanelProps> = ({
  notifications,
  isLoading,
  loadError,
  onAcknowledge,
  onMarkHandled,
  onClose,
}) => {
  const { t } = useTranslation('overview');
  const router = useRouter();
  const { locale } = useParams<{ locale: string }>();

  const openErrand = (notification: ErrandNotification): void => {
    if (notification.errandId) {
      router.push(`/${locale}/arende/${encodeURIComponent(notification.errandId)}`);
    }
  };

  const unread = notifications.filter((notification) => !notification.acknowledged && !notification.handled);
  const read = notifications.filter((notification) => notification.acknowledged && !notification.handled);
  const handled = notifications.filter((notification) => notification.handled);

  const renderItem = (notification: ErrandNotification, withAcknowledge: boolean, withHandle: boolean) => (
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
        <span className="font-bold text-small">{subTypeLabel(notification.subType, t)}</span>
        {notification.description ?
          <span className="text-small break-words">{notification.description}</span>
        : null}
        <span className="text-small text-dark-secondary">{formatWhen(notification.created)}</span>
      </button>
      {withAcknowledge || withHandle ?
        <div className="flex flex-wrap gap-8">
          {withAcknowledge ?
            <Button
              size="sm"
              variant="tertiary"
              leftIcon={<Check size={16} />}
              onClick={() => {
                onAcknowledge(notification);
              }}
            >
              {t('notifications.markAsRead')}
            </Button>
          : null}
          {withHandle ?
            <Button
              size="sm"
              variant="tertiary"
              leftIcon={<CheckCheck size={16} />}
              onClick={() => {
                onMarkHandled(notification);
              }}
            >
              {t('notifications.markAsHandled')}
            </Button>
          : null}
        </div>
      : null}
    </li>
  );

  return (
    <div className="flex flex-col gap-12 h-full min-h-0">
      <div className="flex items-center justify-between">
        <h2 className="text-h4-sm md:text-h4-md m-0">{t('notifications.heading')}</h2>
        <Button
          size="sm"
          variant="tertiary"
          iconButton
          aria-label={t('notifications.close')}
          leftIcon={<X />}
          onClick={onClose}
        />
      </div>

      <AsyncContent
        isLoading={isLoading}
        error={loadError}
        errorText={t('notifications.loadError')}
        isEmpty={notifications.length === 0}
        emptyText={t('notifications.empty')}
      >
        <div className="flex flex-col gap-16 overflow-y-auto min-h-0">
          {unread.length ?
            <section className="flex flex-col gap-8">
              <h3 className="text-small font-bold m-0">{t('notifications.unread')}</h3>
              <ul className="flex flex-col gap-8 m-0 p-0 list-none">
                {unread.map((item) => renderItem(item, true, true))}
              </ul>
            </section>
          : null}
          {read.length ?
            <section className="flex flex-col gap-8">
              <h3 className="text-small font-bold m-0">{t('notifications.read')}</h3>
              <ul className="flex flex-col gap-8 m-0 p-0 list-none">
                {read.map((item) => renderItem(item, false, true))}
              </ul>
            </section>
          : null}
          {handled.length ?
            <section className="flex flex-col gap-8">
              <h3 className="text-small font-bold m-0">{t('notifications.handled')}</h3>
              <ul className="flex flex-col gap-8 m-0 p-0 list-none">
                {handled.map((item) => renderItem(item, false, false))}
              </ul>
            </section>
          : null}
        </div>
      </AsyncContent>
    </div>
  );
};
