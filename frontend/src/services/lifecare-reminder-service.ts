import {
  CreateLifecareReminderDto,
  LifecareReminderOptionsApiResponse,
  LifecareReminderOptionsView,
  LifecareRemindersApiResponse,
  LifecareReminderView,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, discardData, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/** The bevakningar on the insats of the errand, read live from Lifecare. */
export const getLifecareReminders = (errandId: string): Promise<ServiceResponse<LifecareReminderView[]>> =>
  unwrapData(apiService.get<LifecareRemindersApiResponse>(apiPath`errands/${errandId}/lifecare-reminders`));

/** The priorities and statuses a bevakning can have — Lifecare's own lists — and its proposal for a new one. */
export const getLifecareReminderOptions = (errandId: string): Promise<ServiceResponse<LifecareReminderOptionsView>> =>
  unwrapData(
    apiService.get<LifecareReminderOptionsApiResponse>(apiPath`errands/${errandId}/lifecare-reminders/options`)
  );

/** Adds a bevakning on the insats of the errand in Lifecare. A refusal carries Lifecare's reason in `message`. */
export const createLifecareReminder = (
  errandId: string,
  input: CreateLifecareReminderDto
): Promise<ServiceResponse<null>> =>
  discardData(apiService.post(apiPath`errands/${errandId}/lifecare-reminders`, input));

/**
 * Changes a bevakning on the insats of the errand in Lifecare — also how one is marked done (status
 * "Klar"). A refusal carries Lifecare's reason in `message`.
 */
export const updateLifecareReminder = (
  errandId: string,
  reminderId: number,
  input: CreateLifecareReminderDto
): Promise<ServiceResponse<null>> =>
  discardData(apiService.put(apiPath`errands/${errandId}/lifecare-reminders/${reminderId}`, input));

/** Removes a bevakning from the insats of the errand in Lifecare. A refusal carries Lifecare's reason in `message`. */
export const removeLifecareReminder = (errandId: string, reminderId: number): Promise<ServiceResponse<null>> =>
  discardData(apiService.delete(apiPath`errands/${errandId}/lifecare-reminders/${reminderId}`));
