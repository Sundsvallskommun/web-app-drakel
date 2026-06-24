import { ServiceResponse } from '@interfaces/services';
import { ApiResponse, apiService, toServiceError } from '@services/api-service';

/** A notification addressed to the handläggare (e.g. a new message from the applicant). */
export interface ErrandNotification {
  id?: string;
  errandId?: string;
  ownerId?: string;
  createdBy?: string;
  /** CREATE / UPDATE / DELETE. */
  type?: string;
  /** ERRAND / DECISION / ATTACHMENT / STAKEHOLDER / PARAMETER / MESSAGE / SYSTEM. */
  subType?: string;
  description?: string;
  content?: string;
  acknowledged?: boolean;
  created?: string;
  modified?: string;
}

/** Fetches the current handläggare's notifications across all their errands (newest first). */
export const getNotifications = (): Promise<ServiceResponse<ErrandNotification[]>> =>
  apiService
    .get<ApiResponse<ErrandNotification[]>>('notifications')
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);

/** Marks a single notification as read (or withdraws it). */
export const acknowledgeNotification = (
  errandId: string,
  notificationId: string,
  acknowledged = true
): Promise<ServiceResponse<ErrandNotification>> =>
  apiService
    .patch<ApiResponse<ErrandNotification>>(`errands/${errandId}/notifications/${notificationId}`, { acknowledged })
    .then((res) => ({ data: res.data.data }))
    .catch(toServiceError);
