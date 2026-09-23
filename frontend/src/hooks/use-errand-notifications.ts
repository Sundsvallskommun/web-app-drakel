'use client';

import {
  acknowledgeNotification,
  ErrandNotification,
  getNotifications,
  handleNotification,
} from '@services/notification-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseErrandNotificationsResult {
  notifications: ErrandNotification[];
  unacknowledgedCount: number;
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
  acknowledge: (notification: ErrandNotification) => Promise<void>;
  markHandled: (notification: ErrandNotification) => Promise<void>;
}

const NO_NOTIFICATIONS: ErrandNotification[] = [];

/**
 * Loads the current handläggare's notifications and exposes the two states a notification moves through:
 * acknowledged, meaning it has been seen, and handled, meaning it has been acted on.
 */
export const useErrandNotifications = (): UseErrandNotificationsResult => {
  const {
    data: notifications,
    isLoading,
    error,
    refresh,
  } = useServiceQuery(getNotifications, {
    initialData: NO_NOTIFICATIONS,
  });

  const acknowledge = useCallback(
    async (notification: ErrandNotification): Promise<void> => {
      if (!notification.errandId || !notification.id) {
        return;
      }
      const res = await acknowledgeNotification(notification.errandId, notification.id, true);
      if (!res.error) {
        refresh();
      }
    },
    [refresh]
  );

  const markHandled = useCallback(
    async (notification: ErrandNotification): Promise<void> => {
      if (!notification.errandId || !notification.id) {
        return;
      }
      const res = await handleNotification(notification.errandId, notification.id, true);
      if (!res.error) {
        refresh();
      }
    },
    [refresh]
  );

  const unacknowledgedCount = notifications.filter((notification) => !notification.acknowledged).length;

  return { notifications, unacknowledgedCount, isLoading, error, refresh, acknowledge, markHandled };
};
