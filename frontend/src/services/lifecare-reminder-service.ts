import {
  CreateLifecareReminderDto,
  LifecareReminderOptionsApiResponse,
  LifecareReminderOptionsView,
  LifecareRemindersApiResponse,
  LifecareReminderView,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** The bevakningar on the insats of the errand, read live from Lifecare. */
export const getLifecareReminders = (errandId: string): Promise<ServiceResponse<LifecareReminderView[]>> =>
  apiService
    .get<LifecareRemindersApiResponse>(`errands/${errandId}/lifecare-reminders`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** The priorities and statuses a bevakning can have — Lifecare's own lists — and its proposal for a new one. */
export const getLifecareReminderOptions = (errandId: string): Promise<ServiceResponse<LifecareReminderOptionsView>> =>
  apiService
    .get<LifecareReminderOptionsApiResponse>(`errands/${errandId}/lifecare-reminders/options`)
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Adds a bevakning on the insats of the errand in Lifecare. A refusal carries Lifecare's reason in `message`. */
export const createLifecareReminder = (
  errandId: string,
  input: CreateLifecareReminderDto
): Promise<ServiceResponse<null>> =>
  apiService
    .post<ApiResponse>(`errands/${errandId}/lifecare-reminders`, input)
    .then(() => ({ data: null }))
    .catch(toServiceError);

/**
 * Changes a bevakning on the insats of the errand in Lifecare — also how one is marked done (status
 * "Klar"). A refusal carries Lifecare's reason in `message`.
 */
export const updateLifecareReminder = (
  errandId: string,
  reminderId: number,
  input: CreateLifecareReminderDto
): Promise<ServiceResponse<null>> =>
  apiService
    .put<ApiResponse>(`errands/${errandId}/lifecare-reminders/${String(reminderId)}`, input)
    .then(() => ({ data: null }))
    .catch(toServiceError);

/** Removes a bevakning from the insats of the errand in Lifecare. A refusal carries Lifecare's reason in `message`. */
export const removeLifecareReminder = (errandId: string, reminderId: number): Promise<ServiceResponse<null>> =>
  apiService
    .delete<ApiResponse>(`errands/${errandId}/lifecare-reminders/${String(reminderId)}`)
    .then(() => ({ data: null }))
    .catch(toServiceError);
