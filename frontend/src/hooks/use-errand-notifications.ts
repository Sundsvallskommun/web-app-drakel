'use client';

import { acknowledgeNotification, ErrandNotification, getNotifications } from '@services/notification-service';
import { useCallback, useEffect, useState } from 'react';

export interface UseErrandNotificationsResult {
  notifications: ErrandNotification[];
  unacknowledgedCount: number;
  isLoading: boolean;
  error?: number | string | boolean;
  refresh: () => void;
  acknowledge: (notification: ErrandNotification) => Promise<void>;
}

/** Loads the current handläggare's notifications and exposes a per-notification acknowledge. */
export const useErrandNotifications = (): UseErrandNotificationsResult => {
  const [notifications, setNotifications] = useState<ErrandNotification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<number | string | boolean>();

  const load = useCallback(() => {
    setIsLoading(true);
    void getNotifications().then((res) => {
      if (res.error) {
        setError(res.error);
        setNotifications([]);
      } else {
        setError(undefined);
        setNotifications(res.data ?? []);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const acknowledge = useCallback(
    async (notification: ErrandNotification): Promise<void> => {
      if (!notification.errandId || !notification.id) {
        return;
      }
      const res = await acknowledgeNotification(notification.errandId, notification.id, true);
      if (!res.error) {
        load();
      }
    },
    [load]
  );

  const unacknowledgedCount = notifications.filter((notification) => !notification.acknowledged).length;

  return { notifications, unacknowledgedCount, isLoading, error, refresh: load, acknowledge };
};
