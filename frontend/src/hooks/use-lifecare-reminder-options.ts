'use client';

import { LifecareReminderOptionsView } from '@data-contracts/backend/data-contracts';
import { getLifecareReminderOptions } from '@services/lifecare-reminder-service';
import { useCallback } from 'react';

import { ServiceError, useServiceQuery } from './use-service-query';

const NO_OPTIONS: LifecareReminderOptionsView = {
  priorities: [],
  statuses: [],
  defaultPriority: 0,
  defaultStatus: 0,
};

/** The priorities and statuses a bevakning on the errand's insats can have, as Lifecare lists them. */
export const useLifecareReminderOptions = (
  errandId: string
): { options: LifecareReminderOptionsView; isLoading: boolean; error?: ServiceError } => {
  const fetchOptions = useCallback(() => getLifecareReminderOptions(errandId), [errandId]);
  const { data, isLoading, error } = useServiceQuery(fetchOptions, { initialData: NO_OPTIONS, ready: !!errandId });
  return { options: data, isLoading, error };
};
