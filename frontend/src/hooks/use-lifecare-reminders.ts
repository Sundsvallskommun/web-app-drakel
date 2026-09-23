'use client';

import { LifecareReminderView } from '@data-contracts/backend/data-contracts';
import { getLifecareReminders } from '@services/lifecare-reminder-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

interface UseLifecareRemindersResult {
  reminders: LifecareReminderView[];
  isLoading: boolean;
  error?: ServiceError;
  refresh: () => void;
}

const NO_REMINDERS: LifecareReminderView[] = [];

/**
 * The bevakningar on the errand's insats, read live from Lifecare — the register of record. `enabled`
 * gates the read (it is logged on the errand) to when the Bevakningar section is open.
 */
export const useLifecareReminders = (errandId: string, enabled = true): UseLifecareRemindersResult => {
  const fetchReminders = useCallback(() => getLifecareReminders(errandId), [errandId]);
  const { data, ...query } = useServiceQuery(fetchReminders, {
    initialData: NO_REMINDERS,
    enabled: enabled && !!errandId,
  });
  return { reminders: data, ...query };
};
