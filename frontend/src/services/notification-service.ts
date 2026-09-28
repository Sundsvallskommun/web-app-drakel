import {
  ErrandNotification,
  ErrandNotificationApiResponse,
  ErrandNotificationsApiResponse,
} from '@data-contracts/backend/data-contracts';
import { ServiceResponse } from '@interfaces/services';
import { apiService, unwrapData } from '@services/api-service';
import { apiPath } from '@utils/api-path';

/**
 * A notification addressed to the handläggare (e.g. a new message from the applicant). `acknowledged` means seen,
 * `handled` acted on — marking it handled also acknowledges it.
 */
export type { ErrandNotification };

/** Fetches the current handläggare's notifications across all their errands (newest first). */
export const getNotifications = (): Promise<ServiceResponse<ErrandNotification[]>> =>
  unwrapData(apiService.get<ErrandNotificationsApiResponse>('notifications'));

/** Marks a single notification as read (or withdraws it). */
export const acknowledgeNotification = (
  errandId: string,
  notificationId: string,
  acknowledged = true
): Promise<ServiceResponse<ErrandNotification>> =>
  unwrapData(
    apiService.patch<ErrandNotificationApiResponse>(apiPath`errands/${errandId}/notifications/${notificationId}`, {
      acknowledged,
    })
  );

/**
 * Marks a single notification as acted on. The API acknowledges it at the same time, so a notification
 * cannot end up handled without also counting as read.
 */
export const handleNotification = (
  errandId: string,
  notificationId: string,
  handled = true
): Promise<ServiceResponse<ErrandNotification>> =>
  unwrapData(
    apiService.patch<ErrandNotificationApiResponse>(apiPath`errands/${errandId}/notifications/${notificationId}`, {
      handled,
    })
  );
